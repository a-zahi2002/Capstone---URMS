/**
 * bookingCtrl.ts
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for /api/bookings.
 *
 * Full CRUD:
 *   GET    /                → getAllBookings
 *   GET    /:id             → getBookingById
 *   POST   /                → createBooking
 *   PATCH  /:id             → updateBooking
 *   DELETE /:id             → deleteBooking
 *
 * Existing admin endpoints (preserved):
 *   GET    /pending         → getPendingBookings
 *   PUT    /:id/status      → updateBookingStatus
 *   PATCH  /:id/status      → updateBookingStatus
 * ─────────────────────────────────────────────────────────────
 */
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { supabase } from "../config/supabaseClient";
import { BookingModel } from "../models/booking.model";
import { sendNotification } from "../services/notificationService";
import { sendNotificationToUser } from "../services/socketService";
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from "../services/emailService";

// ── GET /api/bookings ──────────────────────────────────────
/**
 * List bookings with optional query-string filters:
 *   ?user_id=<uid>          — filter by user
 *   ?resource_id=<uuid>     — filter by resource
 *   ?status=Pending|Approved|Cancelled|Completed
 *   ?from=<ISO>             — bookings ending after this date
 *   ?to=<ISO>               — bookings starting before this date
 */
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { user_id, resource_id, status, from, to } = req.query as Record<string, string | undefined>;

    const data = await BookingModel.findAll(
      { user_id, resource_id, status, from, to },
      req.supabase
    );

    res.json({ status: "success", data });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── GET /api/bookings/:id ──────────────────────────────────
export const getBookingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await BookingModel.findById(req.params.id as string, req.supabase);

    if (!booking) {
      res.status(404).json({ status: "error", message: "Booking not found" });
      return;
    }

    res.json({ status: "success", data: booking });
  } catch (error: any) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── POST /api/bookings ─────────────────────────────────────
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resource_id, start_time, end_time } = req.body;

    // Validation
    if (!resource_id || !start_time || !end_time) {
      res.status(400).json({
        status: "error",
        message: "Missing required fields: resource_id, start_time, end_time",
      });
      return;
    }

    const start = new Date(start_time);
    const end = new Date(end_time);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({ status: "error", message: "Invalid date format for start_time or end_time" });
      return;
    }
    if (end <= start) {
      res.status(400).json({ status: "error", message: "end_time must be after start_time" });
      return;
    }

    // Conflict check
    const hasConflict = await BookingModel.checkConflicts(
      resource_id,
      start.toISOString(),
      end.toISOString(),
      undefined,
      req.supabase
    );
    if (hasConflict) {
      res.status(409).json({
        status: "error",
        message: "Time slot conflicts with an existing booking for this resource",
      });
      return;
    }

    // Use authenticated user as owner
    const user_id = req.body.user_id || req.user?.uid;

    const created = await BookingModel.create(
      {
        resource_id,
        user_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: "Pending",
      },
      req.supabase
    );

    res.status(201).json({ status: "success", message: "Booking created", data: created });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── PATCH /api/bookings/:id ────────────────────────────────
export const updateBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.id as string;
    const { resource_id, start_time, end_time, status } = req.body;

    // Verify booking exists
    const existing = await BookingModel.findById(bookingId, req.supabase);
    if (!existing) {
      res.status(404).json({ status: "error", message: "Booking not found" });
      return;
    }

    // If times or resource are being changed, re-validate
    const newStart = start_time ? new Date(start_time) : new Date(existing.start_time);
    const newEnd = end_time ? new Date(end_time) : new Date(existing.end_time);
    const newResourceId = resource_id || existing.resource_id;

    if (newEnd <= newStart) {
      res.status(400).json({ status: "error", message: "end_time must be after start_time" });
      return;
    }

    // Conflict check (exclude the booking being updated)
    if (start_time || end_time || resource_id) {
      const hasConflict = await BookingModel.checkConflicts(
        newResourceId,
        newStart.toISOString(),
        newEnd.toISOString(),
        bookingId,
        req.supabase
      );
      if (hasConflict) {
        res.status(409).json({
          status: "error",
          message: "Time slot conflicts with an existing booking for this resource",
        });
        return;
      }
    }

    // Only pass fields that were provided
    const updatePayload: Record<string, any> = {};
    if (resource_id) updatePayload.resource_id = resource_id;
    if (start_time)  updatePayload.start_time  = newStart.toISOString();
    if (end_time)    updatePayload.end_time    = newEnd.toISOString();
    if (status)      updatePayload.status      = status;

    const updated = await BookingModel.update(bookingId, updatePayload, req.supabase);
    if (!updated) {
      res.status(404).json({ status: "error", message: "Booking not found or no fields to update" });
      return;
    }

    res.json({ status: "success", message: "Booking updated", data: updated });
  } catch (error: any) {
    console.error("Error updating booking:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ── DELETE /api/bookings/:id ───────────────────────────────
export const deleteBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.id as string;

    const deleted = await BookingModel.delete(bookingId, req.supabase);
    if (!deleted) {
      res.status(404).json({ status: "error", message: "Booking not found" });
      return;
    }

    res.json({ status: "success", message: "Booking deleted" });
  } catch (error: any) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
// Existing admin endpoints (preserved from original)
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/bookings/pending
 * Fetch all pending booking requests. Only accessible by lecturers/admins.
 */
export const getPendingBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role || (req.user?.admin ? "admin" : "student");
    if (role !== "lecturer" && role !== "admin") {
      res.status(403).json({ status: "error", message: "Access denied: Lecturers or Admins only" });
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, status, created_at, resource_id, user_id, users (name, email), resources (name, location)")
      .eq("status", "Pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ status: "success", data });
  } catch (error: any) {
    console.error("Error fetching pending bookings:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

/**
 * PUT /api/bookings/:id/status
 * Approve or Reject a booking. Handles notifications, websockets, and email alerts.
 */
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user?.role || (req.user?.admin ? "admin" : "student");
    if (role !== "lecturer" && role !== "admin") {
      res.status(403).json({ status: "error", message: "Access denied: Lecturers or Admins only" });
      return;
    }

    const bookingId = req.params.id;
    const { status, rejectionReason } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      res.status(400).json({ status: "error", message: "Invalid status value. Must be Approved or Rejected." });
      return;
    }

    // 1. Fetch booking to retrieve user and resource details
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, user_id, resource_id, users (name, email), resources (name, location)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      res.status(404).json({ status: "error", message: "Booking not found" });
      return;
    }

    const targetUser = (booking as any).users;
    const targetResource = (booking as any).resources;
    const targetUserId = booking.user_id;

    // 2. Update status in database
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (updateError) throw updateError;

    // 3. Format Date/Time nicely
    const startObj = new Date(booking.start_time);
    const endObj = new Date(booking.end_time);
    const bookingDate = startObj.toLocaleDateString("en-US", { dateStyle: "medium" });
    const bookingTime = `${startObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${endObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;

    // 4. Send In-App & WebSocket notification
    const notifTitle = `Booking ${status}`;
    const notifType = status === "Approved" ? "success" : "error";
    const notifMessage = status === "Approved"
      ? `Your booking request for ${targetResource?.name || "Resource"} on ${bookingDate} (${bookingTime}) has been approved.`
      : `Your booking request for ${targetResource?.name || "Resource"} on ${bookingDate} (${bookingTime}) was declined.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`;

    const dbRecord = await sendNotification(supabase, targetUserId, notifMessage, notifType, notifTitle);

    sendNotificationToUser(targetUserId, "notification", {
      id: dbRecord?.id || new Date().getTime().toString(),
      title: dbRecord?.title || notifTitle,
      message: dbRecord?.message || notifMessage,
      type: dbRecord?.type || notifType,
      createdAt: dbRecord?.timestamp || new Date().toISOString(),
      read: dbRecord?.is_read || false,
    });

    // 5. Check user email preferences & send email
    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("email_bookings")
      .eq("user_id", targetUserId)
      .maybeSingle();

    // Default to true if preferences record does not exist
    const isEmailEnabled = prefData ? prefData.email_bookings : true;

    if (isEmailEnabled && targetUser?.email) {
      if (status === "Approved") {
        await sendBookingConfirmationEmail(
          targetUser.email,
          targetUser.name,
          targetResource?.name || "Resource",
          bookingDate,
          bookingTime
        );
      } else {
        await sendBookingRejectionEmail(
          targetUser.email,
          targetUser.name,
          targetResource?.name || "Resource",
          bookingDate,
          bookingTime,
          rejectionReason
        );
      }
    }

    res.json({
      status: "success",
      message: `Booking ${status.toLowerCase()} successfully`,
      data: { id: bookingId, status }
    });
  } catch (error: any) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

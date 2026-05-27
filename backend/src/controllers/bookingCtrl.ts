/**
 * bookingCtrl.ts
 * ─────────────────────────────────────────────────────────────
 * HTTP handlers for /api/bookings.
 * ─────────────────────────────────────────────────────────────
 */
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { supabase } from "../config/supabaseClient";
import { sendNotification } from "../services/notificationService";
import { sendNotificationToUser } from "../services/socketService";
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from "../services/emailService";

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

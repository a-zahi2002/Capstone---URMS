/**
 * bookingRoutes.ts
 * ─────────────────────────────────────────────────────────────
 * Route definitions for /api/bookings.
 *
 * CRUD:
 *   GET    /             → list all bookings (filterable)
 *   GET    /:id          → get single booking
 *   POST   /             → create a new booking
 *   PATCH  /:id          → update a booking
 *   DELETE /:id          → delete a booking
 *
 * Admin:
 *   GET    /pending      → pending approvals queue
 *   PUT    /:id/status   → approve / reject
 *   PATCH  /:id/status   → approve / reject
 * ─────────────────────────────────────────────────────────────
 */
import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getPendingBookings,
  updateBookingStatus,
  getMyBookings,
} from "../controllers/bookingCtrl";

const router = express.Router();

// Apply auth middleware to all booking routes
router.use(verifyToken);

// ── CRUD ────────────────────────────────────────────────────
router.get("/", getAllBookings as any);
router.post("/", createBooking as any);

// ── Admin: pending queue (must come before /:id) ────────────
router.get("/pending", getPendingBookings as any);

// ── My Bookings (must come before /:id) ─────────────────────
router.get("/my", getMyBookings as any);

// ── Single booking operations ───────────────────────────────
router.get("/:id", getBookingById as any);
router.patch("/:id", updateBooking as any);
router.delete("/:id", deleteBooking as any);

// ── Admin: status update ────────────────────────────────────
router.put("/:id/status", updateBookingStatus as any);
router.patch("/:id/status", updateBookingStatus as any);

export default router;

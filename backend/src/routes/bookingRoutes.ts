/**
 * bookingRoutes.ts
 * ─────────────────────────────────────────────────────────────
 * Route definitions for /api/bookings.
 * ─────────────────────────────────────────────────────────────
 */
import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { getPendingBookings, updateBookingStatus } from "../controllers/bookingCtrl";

const router = express.Router();

// Apply auth middleware to all booking routes
router.use(verifyToken);

// Pending approvals queue
router.get("/pending", getPendingBookings as any);

// Status update (Approve/Reject)
router.put("/:id/status", updateBookingStatus as any);
router.patch("/:id/status", updateBookingStatus as any);

export default router;

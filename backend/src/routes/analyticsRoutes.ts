import express from "express";
import {
    getOverviewAnalytics,
    getBookingAnalytics,
    getResourceAnalytics,
    getMaintenanceAnalytics,
    getBookingTrends,
    getBookingStatus,
    getResourceBookings,
    getCategoryBookings,
    getResourceUtilization,
    getPeakUsage,
    exportAnalyticsPDF,
    exportAnalyticsExcel,
    exportAnalyticsSheets,
} from "../controllers/analyticsCtrl";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware";

const router = express.Router();

// All analytics routes require admin access
router.use(verifyToken as express.RequestHandler);
router.use(requireAdmin as express.RequestHandler);

// Overview / summary
router.get("/overview", getOverviewAnalytics as any);
router.get("/bookings", getBookingAnalytics as any);
router.get("/resources", getResourceAnalytics as any);
router.get("/maintenance", getMaintenanceAnalytics as any);

// Detailed booking statistics
router.get("/booking-trends", getBookingTrends as any);
router.get("/booking-status", getBookingStatus as any);
router.get("/resource-bookings", getResourceBookings as any);
router.get("/category-bookings", getCategoryBookings as any);

// Utilization and peak usage
router.get("/resource-utilization", getResourceUtilization as any);
router.get("/peak-usage", getPeakUsage as any);

// Export routes — names match frontend fetch calls exactly
router.get("/export/pdf", exportAnalyticsPDF as any);
router.get("/export/excel", exportAnalyticsExcel as any);
router.get("/export/google-sheets", exportAnalyticsSheets as any);  // ← was '/export/sheets' (404 fix)

export default router;

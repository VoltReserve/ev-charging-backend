import express from "express";
import {
  getDashboard,
  getBookingsReport,
  getBookingsByStation,
  getChargerUtilization,
  getActiveBookingsReport,
  getUpcomingBookingsReport,
  getCompletedBookingsReport,
  getCancelledBookingsReport,
  getDateWiseReport,
  getUserReport,
  exportCsvReport,
  exportExcelReport,
} from "../controllers/reportController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/dashboard", requireAdmin, getDashboard);
router.get("/reports/bookings", requireAdmin, getBookingsReport);
router.get("/reports/bookings-by-station", requireAdmin, getBookingsByStation);
router.get("/reports/charger-utilization", requireAdmin, getChargerUtilization);
router.get("/reports/active-bookings", requireAdmin, getActiveBookingsReport);
router.get("/reports/upcoming-bookings", requireAdmin, getUpcomingBookingsReport);
router.get(
  "/reports/completed-bookings",
  requireAdmin,
  getCompletedBookingsReport
);
router.get(
  "/reports/cancelled-bookings",
  requireAdmin,
  getCancelledBookingsReport
);
router.get("/reports/date-wise", requireAdmin, getDateWiseReport);
router.get("/reports/users", requireAdmin, getUserReport);
router.get("/reports/export/csv", requireAdmin, exportCsvReport);
router.get("/reports/export/excel", requireAdmin, exportExcelReport);

export default router;

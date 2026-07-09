import express from "express";
import {
  getAvailableSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/bookingController.js";
import { requireUser } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/available-slots", getAvailableSlots);
router.get("/my-bookings", requireUser, getMyBookings);
router.post("/", requireUser, createBooking);
router.put("/:id/cancel", requireUser, cancelBooking);

export default router;

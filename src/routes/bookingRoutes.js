import express from "express";
import { createBooking } from "../controllers/bookingController.js";
import { requireUser } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", requireUser, createBooking);

export default router;
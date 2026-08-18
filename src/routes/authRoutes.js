import express from "express";
import {
  sendOTP,
  verifyOTP,
  completeProfile,
  updateProfile,
} from "../controllers/authController.js";
import { requireUser } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/complete-profile", completeProfile);
router.put("/profile", requireUser, updateProfile);

export default router;

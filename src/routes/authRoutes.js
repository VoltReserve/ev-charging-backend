import express from "express";
import {
  sendOTP,
  verifyOTP,
  completeProfile,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/complete-profile", completeProfile);

export default router;

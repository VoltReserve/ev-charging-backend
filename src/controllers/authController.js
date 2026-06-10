import bcrypt from "bcryptjs";
import User from "../models/User.js";
import OtpVerification from "../models/OtpVerification.js";
import generateOTP from "../utils/generateOTP.js";
import generateToken from "../utils/generateToken.js";

const isValidMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);

export const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10-digit mobile number is required",
      });
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OtpVerification.deleteMany({ mobile });

    await OtpVerification.create({
      mobile,
      otp: hashedOTP,
      expiresAt,
    });

    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !isValidMobile(mobile) || !otp) {
      return res.status(400).json({
        success: false,
        message: "Valid mobile number and OTP are required",
      });
    }

    const otpRecord = await OtpVerification.findOne({ mobile }).sort({
      createdAt: -1,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP",
      });
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const user = await User.findOne({ mobile });

    if (user) {
      const token = generateToken({ id: user._id, role: "user" });

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.fullName,
          mobile: user.mobile,
        },
      });
    }

    res.status(200).json({
      success: true,
      isNewUser: true,
      message: "Complete your profile",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { mobile, fullName, carModel, registrationNumber } = req.body;

    if (!mobile || !isValidMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid mobile number is required",
      });
    }

    if (!fullName || !carModel || !registrationNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, car model, and registration number are required",
      });
    }

    const verifiedOTP = await OtpVerification.findOne({
      mobile,
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!verifiedOTP) {
      return res.status(400).json({
        success: false,
        message: "Mobile number not verified. Please verify OTP first",
      });
    }

    const existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please login",
      });
    }

    const user = await User.create({
      fullName,
      mobile,
      carModel,
      registrationNumber: registrationNumber.toUpperCase(),
      isVerified: true,
    });

    await OtpVerification.deleteMany({ mobile });

    const token = generateToken({ id: user._id, role: "user" });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        fullName: user.fullName,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

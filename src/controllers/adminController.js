import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import generateToken from "../utils/generateToken.js";

const formatUser = (user, totalBookings = 0) => ({
  id: user._id,
  fullName: user.fullName,
  mobile: user.mobile,
  carModel: user.carModel,
  registrationNumber: user.registrationNumber,
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  totalBookings,
});

const formatUserBooking = (booking) => ({
  bookingId: booking.bookingId,
  station: booking.stationId?.stationName || "—",
  charger: booking.chargerId?.chargerCode || "—",
  bookingDate: booking.bookingDate
    ? booking.bookingDate.toISOString().split("T")[0]
    : "—",
  startTime: booking.startTime,
  endTime: booking.endTime,
  status: booking.status,
});

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({ id: admin._id, role: "admin" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const formatAdmin = (admin) => ({
  id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  createdAt: admin.createdAt,
});

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      admins: admins.map(formatAdmin),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createAdminAccount = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "An admin with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: formatAdmin(admin),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An admin with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    const counts = await Booking.aggregate([
      { $group: { _id: "$userId", totalBookings: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      counts.map((row) => [String(row._id), row.totalBookings])
    );

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) =>
        formatUser(user, countMap.get(String(user._id)) ?? 0)
      ),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bookings = await Booking.find({ userId: id })
      .populate("stationId", "stationName")
      .populate("chargerId", "chargerCode")
      .sort({ bookingDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      user: formatUser(user, bookings.length),
      bookings: bookings.map(formatUserBooking),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

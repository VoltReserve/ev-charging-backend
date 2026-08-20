import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Charger from "../models/Charger.js";
import Station from "../models/Station.js";
import generateBookingId from "../utils/generateBookingId.js";
import { updateBookingStatuses } from "../jobs/bookingStatusJob.js";
import {
  combineDateAndTime,
  filterAvailableSlots,
  generateDaySlots,
  getDayRange,
  hasOverlap,
  isValidDate,
  isValidTime,
} from "../utils/slotUtils.js";

const ACTIVE_BOOKING_STATUSES = ["Upcoming", "Active"];

const getBookedBookings = async (chargerId, dateStr) => {
  const { start, end } = getDayRange(dateStr);

  return Booking.find({
    chargerId,
    bookingDate: { $gte: start, $lte: end },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });
};

export const getAvailableSlots = async (req, res) => {
  try {
    const { stationId, chargerId, date } = req.query;

    if (!stationId || !chargerId || !date) {
      return res.status(400).json({
        success: false,
        message: "stationId, chargerId, and date are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(stationId) ||
      !mongoose.Types.ObjectId.isValid(chargerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid station or charger ID",
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format",
      });
    }

    const station = await Station.findOne({ _id: stationId, status: "Active" });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const charger = await Charger.findOne({
      _id: chargerId,
      stationId,
      status: "Available",
    });

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found or not available",
      });
    }

    const allSlots = generateDaySlots(charger.slotDuration);
    const bookedBookings = await getBookedBookings(chargerId, date);
    const availableSlots = filterAvailableSlots(allSlots, bookedBookings, date);

    res.status(200).json({
      success: true,
      slotDuration: charger.slotDuration,
      availableSlots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const { stationId, chargerId, bookingDate, startTime } = req.body;

    if (!stationId || !chargerId || !bookingDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: "stationId, chargerId, bookingDate, and startTime are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(stationId) ||
      !mongoose.Types.ObjectId.isValid(chargerId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid station or charger ID",
      });
    }

    if (!isValidDate(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: "bookingDate must be in YYYY-MM-DD format",
      });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).json({
        success: false,
        message: "startTime must be in HH:mm format",
      });
    }

    const station = await Station.findOne({ _id: stationId, status: "Active" });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const charger = await Charger.findOne({
      _id: chargerId,
      stationId,
      status: "Available",
    });

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found or not available",
      });
    }

    const startDateTime = combineDateAndTime(bookingDate, startTime);
    const endDateTime = new Date(
      startDateTime.getTime() + charger.slotDuration * 60 * 1000
    );

    const allSlots = generateDaySlots(charger.slotDuration);
    const isValidSlot = allSlots.some(
      (slot) => slot.startTime === startTime
    );

    if (!isValidSlot) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time for this charger's slot duration",
      });
    }

    if (startDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book a slot in the past",
      });
    }

    const bookedBookings = await getBookedBookings(chargerId, bookingDate);

    const overlap = bookedBookings.some((booking) =>
      hasOverlap(startDateTime, endDateTime, booking.startTime, booking.endTime)
    );

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: "Selected slot is no longer available",
      });
    }

    const { start: dayStart } = getDayRange(bookingDate);
    const bookingId = await generateBookingId();

    const booking = await Booking.create({
      bookingId,
      userId: req.user.id,
      stationId,
      chargerId,
      bookingDate: dayStart,
      startTime: startDateTime,
      endTime: endDateTime,
      totalMinutes: charger.slotDuration,
      status: "Upcoming",
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: {
        id: booking._id,
        bookingId: booking.bookingId,
        station: station.stationName,
        charger: charger.chargerCode,
        bookingDate,
        startTime,
        endTime: `${String(endDateTime.getHours()).padStart(2, "0")}:${String(endDateTime.getMinutes()).padStart(2, "0")}`,
        totalMinutes: booking.totalMinutes,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    await updateBookingStatuses();

    const bookings = await Booking.find({ userId: req.user.id })
      .populate("stationId", "stationName")
      .populate("chargerId", "chargerCode chargerType")
      .sort({ startTime: -1 });

    res.status(200).json(
      bookings.map((booking) => ({
        id: booking._id,
        bookingId: booking.bookingId,
        station: booking.stationId?.stationName,
        charger: booking.chargerId?.chargerCode,
        bookingDate: booking.bookingDate.toISOString().split("T")[0],
        startTime: booking.startTime,
        endTime: booking.endTime,
        totalMinutes: booking.totalMinutes,
        status: booking.status,
      }))
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    await updateBookingStatuses();

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own bookings",
      });
    }

    if (booking.status !== "Upcoming") {
      return res.status(400).json({
        success: false,
        message: "Only upcoming bookings can be cancelled",
      });
    }

    if (new Date() >= booking.startTime) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a booking that has already started",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        bookingId: booking.bookingId,
        status: booking.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

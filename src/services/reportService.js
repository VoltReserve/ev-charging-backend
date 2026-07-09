import Booking from "../models/Booking.js";
import Station from "../models/Station.js";
import Charger from "../models/Charger.js";
import User from "../models/User.js";
import { getDayRange, isValidDate } from "../utils/slotUtils.js";

const getNow = () => new Date();

const completedBookingFilter = (now = getNow()) => ({
  $or: [{ status: "Completed" }, { endTime: { $lt: now }, status: { $ne: "Cancelled" } }],
});

const activeBookingFilter = (now = getNow()) => ({
  status: { $ne: "Cancelled" },
  startTime: { $lte: now },
  endTime: { $gte: now },
});

export const getDashboardSummary = async () => {
  const now = getNow();

  const [
    totalStations,
    totalChargers,
    totalUsers,
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
  ] = await Promise.all([
    Station.countDocuments(),
    Charger.countDocuments(),
    User.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments(activeBookingFilter(now)),
    Booking.countDocuments(completedBookingFilter(now)),
    Booking.countDocuments({ status: "Cancelled" }),
  ]);

  return {
    totalStations,
    totalChargers,
    totalUsers,
    totalBookings,
    activeBookings,
    completedBookings,
    cancelledBookings,
  };
};

export const getTotalBookings = async () => {
  const totalBookings = await Booking.countDocuments();
  return { totalBookings };
};

export const getBookingsByStation = async () => {
  const results = await Booking.aggregate([
    {
      $group: {
        _id: "$stationId",
        bookings: { $sum: 1 },
      },
    },
    { $sort: { bookings: -1 } },
    {
      $lookup: {
        from: "stations",
        localField: "_id",
        foreignField: "_id",
        as: "station",
      },
    },
    { $unwind: "$station" },
    {
      $project: {
        _id: 0,
        station: "$station.stationName",
        bookings: 1,
      },
    },
  ]);

  return results;
};

export const getChargerUtilization = async () => {
  const results = await Booking.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$chargerId",
        usage: { $sum: 1 },
      },
    },
    { $sort: { usage: -1 } },
    {
      $lookup: {
        from: "chargers",
        localField: "_id",
        foreignField: "_id",
        as: "charger",
      },
    },
    { $unwind: "$charger" },
    {
      $project: {
        _id: 0,
        charger: "$charger.chargerCode",
        usage: 1,
      },
    },
  ]);

  return results;
};

export const getActiveBookings = async () => {
  const now = getNow();

  const bookings = await Booking.find(activeBookingFilter(now))
    .populate("stationId", "stationName")
    .populate("chargerId", "chargerCode")
    .populate("userId", "fullName")
    .sort({ startTime: 1 });

  return bookings.map((booking) => ({
    bookingId: booking.bookingId,
    station: booking.stationId?.stationName,
    charger: booking.chargerId?.chargerCode,
    user: booking.userId?.fullName,
  }));
};

export const getCompletedBookings = async () => {
  const now = getNow();

  const bookings = await Booking.find(completedBookingFilter(now))
    .populate("stationId", "stationName")
    .populate("chargerId", "chargerCode")
    .populate("userId", "fullName")
    .sort({ endTime: -1 });

  return bookings.map((booking) => ({
    bookingId: booking.bookingId,
    station: booking.stationId?.stationName,
    charger: booking.chargerId?.chargerCode,
    user: booking.userId?.fullName,
    bookingDate: booking.bookingDate.toISOString().split("T")[0],
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
  }));
};

export const getDateWiseReport = async (from, to) => {
  if (!from || !to) {
    throw new Error("from and to query parameters are required");
  }

  if (!isValidDate(from) || !isValidDate(to)) {
    throw new Error("Dates must be in YYYY-MM-DD format");
  }

  const { start: fromStart } = getDayRange(from);
  const { end: toEnd } = getDayRange(to);

  if (fromStart > toEnd) {
    throw new Error("'from' date cannot be after 'to' date");
  }

  const dateFilter = {
    bookingDate: { $gte: fromStart, $lte: toEnd },
  };

  const [totalBookings, completedBookings, cancelledBookings] = await Promise.all([
    Booking.countDocuments(dateFilter),
    Booking.countDocuments({
      ...dateFilter,
      ...completedBookingFilter(),
    }),
    Booking.countDocuments({ ...dateFilter, status: "Cancelled" }),
  ]);

  return {
    from,
    to,
    totalBookings,
    completedBookings,
    cancelledBookings,
  };
};

export const getUserReport = async () => {
  const results = await Booking.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$userId",
        totalBookings: { $sum: 1 },
      },
    },
    { $sort: { totalBookings: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        name: "$user.fullName",
        mobile: "$user.mobile",
        totalBookings: 1,
      },
    },
  ]);

  return results;
};

export const getAllBookingsForExport = async () => {
  const bookings = await Booking.find()
    .populate("stationId", "stationName")
    .populate("chargerId", "chargerCode")
    .sort({ bookingDate: -1, startTime: -1 });

  return bookings.map((booking) => ({
    bookingId: booking.bookingId,
    station: booking.stationId?.stationName || "",
    charger: booking.chargerId?.chargerCode || "",
    date: booking.bookingDate.toISOString().split("T")[0],
    status: booking.status,
  }));
};

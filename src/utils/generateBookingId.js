import Booking from "../models/Booking.js";

const generateBookingId = async () => {
  const lastBooking = await Booking.findOne({ bookingId: /^EVB\d+$/ })
    .sort({ createdAt: -1 })
    .select("bookingId");

  if (!lastBooking) {
    return "EVB1001";
  }

  const lastNumber = parseInt(lastBooking.bookingId.replace("EVB", ""), 10);
  return `EVB${lastNumber + 1}`;
};

export default generateBookingId;

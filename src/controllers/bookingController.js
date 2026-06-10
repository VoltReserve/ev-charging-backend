export const createBooking = (req, res) => {
  res.status(200).json({
    success: true,
    message: "User access granted. Booking system coming next.",
    requestedBy: req.user.id,
  });
};
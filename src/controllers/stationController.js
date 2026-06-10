export const createStation = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted. Station CRUD coming next.",
    requestedBy: req.user.id,
  });
};
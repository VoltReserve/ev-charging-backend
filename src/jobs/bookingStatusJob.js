import Booking from "../models/Booking.js";

export const updateBookingStatuses = async () => {
  const now = new Date();

  const completed = await Booking.updateMany(
    {
      status: { $in: ["Upcoming", "Active"] },
      endTime: { $lt: now },
    },
    { $set: { status: "Completed" } }
  );

  const activated = await Booking.updateMany(
    {
      status: "Upcoming",
      startTime: { $lte: now },
      endTime: { $gte: now },
    },
    { $set: { status: "Active" } }
  );

  return {
    completed: completed.modifiedCount,
    activated: activated.modifiedCount,
  };
};

export const startBookingStatusJob = (intervalMs = 60 * 1000) => {
  const run = async () => {
    try {
      const result = await updateBookingStatuses();
      if (result.completed > 0 || result.activated > 0) {
        console.log(
          `Booking statuses updated: ${result.activated} activated, ${result.completed} completed`
        );
      }
    } catch (error) {
      console.error("Booking status job error:", error.message);
    }
  };

  run();
  const interval = setInterval(run, intervalMs);

  return () => clearInterval(interval);
};
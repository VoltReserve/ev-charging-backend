import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    stationName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Station", stationSchema);

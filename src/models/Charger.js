import mongoose from "mongoose";

const chargerSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    chargerCode: {
      type: String,
      required: true,
      trim: true,
    },
    chargerType: {
      type: String,
      enum: ["AC", "DC"],
      required: true,
    },
    powerRating: {
      type: String,
      required: true,
      trim: true,
    },
    slotDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Available", "Busy", "Maintenance", "Not Working"],
      default: "Available",
    },
  },
  { timestamps: true }
);

chargerSchema.index({ stationId: 1, chargerCode: 1 }, { unique: true });

export default mongoose.model("Charger", chargerSchema);

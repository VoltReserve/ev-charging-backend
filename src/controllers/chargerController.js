import mongoose from "mongoose";
import Charger from "../models/Charger.js";
import Station from "../models/Station.js";

const CHARGER_STATUSES = ["Available", "Busy", "Maintenance", "Not Working"];
const CHARGER_TYPES = ["AC", "DC"];

const formatChargerPublic = (charger) => ({
  _id: charger._id,
  chargerCode: charger.chargerCode,
  chargerType: charger.chargerType,
  powerRating: charger.powerRating,
  slotDuration: charger.slotDuration,
});

const formatChargerAdmin = (charger) => ({
  id: charger._id,
  stationId: charger.stationId,
  chargerCode: charger.chargerCode,
  chargerType: charger.chargerType,
  powerRating: charger.powerRating,
  slotDuration: charger.slotDuration,
  status: charger.status,
});

const formatChargerAdminList = (charger) => ({
  id: charger._id,
  stationId: charger.stationId,
  chargerCode: charger.chargerCode,
  chargerType: charger.chargerType,
  powerRating: charger.powerRating,
  slotDuration: charger.slotDuration,
  status: charger.status,
});

const isValidStatus = (status) => CHARGER_STATUSES.includes(status);
const isValidType = (type) => CHARGER_TYPES.includes(type);

export const createCharger = async (req, res) => {
  try {
    const {
      stationId,
      chargerCode,
      chargerType,
      powerRating,
      slotDuration,
      status = "Available",
    } = req.body;

    if (!stationId || !mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid station ID is required",
      });
    }

    if (!chargerCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Charger code is required",
      });
    }

    if (!chargerType || !isValidType(chargerType)) {
      return res.status(400).json({
        success: false,
        message: "Charger type must be AC or DC",
      });
    }

    if (!powerRating?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Power rating is required",
      });
    }

    if (!slotDuration || slotDuration < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid slot duration is required",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger status",
      });
    }

    const station = await Station.findById(stationId);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const existingCharger = await Charger.findOne({
      stationId,
      chargerCode: chargerCode.trim().toUpperCase(),
    });

    if (existingCharger) {
      return res.status(400).json({
        success: false,
        message: "Charger code already exists",
      });
    }

    const charger = await Charger.create({
      stationId,
      chargerCode: chargerCode.trim().toUpperCase(),
      chargerType,
      powerRating: powerRating.trim(),
      slotDuration,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Charger created successfully",
      charger: formatChargerAdmin(charger),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Charger code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllChargersAdmin = async (req, res) => {
  try {
    const chargers = await Charger.find()
      .sort({ stationId: 1, chargerCode: 1 })
      .populate("stationId", "stationName");

    res.status(200).json(chargers.map(formatChargerAdminList));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChargersByStation = async (req, res) => {
  try {
    const { stationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(stationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid station ID",
      });
    }

    const station = await Station.findOne({ _id: stationId, status: "Active" });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    const chargers = await Charger.find({
      stationId,
      status: "Available",
    }).sort({ chargerCode: 1 });

    res.status(200).json(chargers.map(formatChargerPublic));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChargerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    const charger = await Charger.findById(id).populate(
      "stationId",
      "stationName status"
    );

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found",
      });
    }

    res.status(200).json({
      success: true,
      charger: {
        ...formatChargerAdmin(charger),
        station: charger.stationId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCharger = async (req, res) => {
  try {
    const { id } = req.params;
    const { chargerCode, chargerType, powerRating, slotDuration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    if (!chargerCode && !chargerType && !powerRating && !slotDuration) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    const charger = await Charger.findById(id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found",
      });
    }

    if (chargerType && !isValidType(chargerType)) {
      return res.status(400).json({
        success: false,
        message: "Charger type must be AC or DC",
      });
    }

    if (slotDuration !== undefined && slotDuration < 1) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be at least 1 minute",
      });
    }

    if (chargerCode?.trim()) {
      const duplicate = await Charger.findOne({
        stationId: charger.stationId,
        chargerCode: chargerCode.trim().toUpperCase(),
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Charger code already exists",
        });
      }

      charger.chargerCode = chargerCode.trim().toUpperCase();
    }

    if (chargerType) charger.chargerType = chargerType;
    if (powerRating?.trim()) charger.powerRating = powerRating.trim();
    if (slotDuration) charger.slotDuration = slotDuration;

    await charger.save();

    res.status(200).json({
      success: true,
      message: "Charger updated successfully",
      charger: formatChargerAdmin(charger),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Charger code already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateChargerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid charger ID",
      });
    }

    if (!status || !isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    const charger = await Charger.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Charger status updated to ${status}`,
      charger: formatChargerAdmin(charger),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

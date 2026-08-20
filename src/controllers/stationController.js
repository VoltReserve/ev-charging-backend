import mongoose from "mongoose";
import Station from "../models/Station.js";
import Charger from "../models/Charger.js";

const formatStation = (station, chargersCount = 0) => ({
  id: station._id,
  stationName: station.stationName,
  status: station.status,
  chargersCount,
});

const getChargerCountsByStation = async (stationIds) => {
  if (!stationIds.length) return new Map();

  const counts = await Charger.aggregate([
    { $match: { stationId: { $in: stationIds } } },
    { $group: { _id: "$stationId", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((row) => [String(row._id), row.count]));
};

const formatStationsWithCounts = async (stations) => {
  const countMap = await getChargerCountsByStation(stations.map((station) => station._id));
  return stations.map((station) =>
    formatStation(station, countMap.get(String(station._id)) ?? 0)
  );
};

const isValidStatus = (status) => ["Active", "Inactive"].includes(status);

export const createStation = async (req, res) => {
  try {
    const { stationName, status = "Active" } = req.body;

    if (!stationName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Station name is required",
      });
    }

    if (!isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active or Inactive",
      });
    }

    const existingStation = await Station.findOne({
      stationName: { $regex: new RegExp(`^${stationName.trim()}$`, "i") },
    });

    if (existingStation) {
      return res.status(400).json({
        success: false,
        message: "Station already exists",
      });
    }

    const station = await Station.create({
      stationName: stationName.trim(),
      status,
    });

    res.status(201).json({
      success: true,
      message: "Station created successfully",
      station: formatStation(station),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStations = async (req, res) => {
  try {
    const stations = await Station.find({ status: "Active" }).sort({
      stationName: 1,
    });

    res.status(200).json(await formatStationsWithCounts(stations));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllStationsAdmin = async (req, res) => {
  try {
    const stations = await Station.find().sort({ stationName: 1 });

    res.status(200).json({
      success: true,
      count: stations.length,
      stations: await formatStationsWithCounts(stations),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getStationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid station ID",
      });
    }

    const station = await Station.findOne({ _id: id, status: "Active" });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    res.status(200).json(formatStation(station));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const { stationName, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid station ID",
      });
    }

    if (!stationName?.trim() && !status) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    if (status && !isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active or Inactive",
      });
    }

    const station = await Station.findById(id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    if (stationName?.trim()) {
      const duplicate = await Station.findOne({
        stationName: { $regex: new RegExp(`^${stationName.trim()}$`, "i") },
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Station name already exists",
        });
      }

      station.stationName = stationName.trim();
    }

    if (status) {
      station.status = status;
    }

    await station.save();

    res.status(200).json({
      success: true,
      message: "Station updated successfully",
      station: formatStation(station),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateStationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid station ID",
      });
    }

    if (!status || !isValidStatus(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status (Active or Inactive) is required",
      });
    }

    const station = await Station.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Station not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Station marked as ${status}`,
      station: formatStation(station),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

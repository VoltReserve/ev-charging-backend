import express from "express";
import {
  createStation,
  getStations,
  getStationById,
  updateStation,
  updateStationStatus,
} from "../controllers/stationController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getStations);
router.get("/:id", getStationById);
router.post("/", requireAdmin, createStation);
router.put("/:id/status", requireAdmin, updateStationStatus);
router.put("/:id", requireAdmin, updateStation);

export default router;

import express from "express";
import {
  createCharger,
  getChargersByStation,
  getChargerById,
  updateCharger,
  updateChargerStatus,
} from "../controllers/chargerController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/station/:stationId", getChargersByStation);
router.get("/:id", requireAdmin, getChargerById);
router.post("/", requireAdmin, createCharger);
router.put("/:id/status", requireAdmin, updateChargerStatus);
router.put("/:id", requireAdmin, updateCharger);

export default router;

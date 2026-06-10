import express from "express";
import { createStation } from "../controllers/stationController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", requireAdmin, createStation);

export default router;
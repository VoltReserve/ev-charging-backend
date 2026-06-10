import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { getAllStationsAdmin } from "../controllers/stationController.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/stations", requireAdmin, getAllStationsAdmin);

export default router;

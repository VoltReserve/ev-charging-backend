import express from "express";
import { adminLogin } from "../controllers/adminController.js";
import { getAllStationsAdmin } from "../controllers/stationController.js";
import { getAllChargersAdmin } from "../controllers/chargerController.js";
import reportRoutes from "./reportRoutes.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/stations", requireAdmin, getAllStationsAdmin);
router.get("/chargers", requireAdmin, getAllChargersAdmin);
router.use(reportRoutes);

export default router;

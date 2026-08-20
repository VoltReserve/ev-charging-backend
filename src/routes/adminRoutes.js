import express from "express";
import {
  adminLogin,
  createAdminAccount,
  getAllAdmins,
  getAllUsersAdmin,
  getUserByIdAdmin,
} from "../controllers/adminController.js";
import { getAllStationsAdmin } from "../controllers/stationController.js";
import { getAllChargersAdmin } from "../controllers/chargerController.js";
import reportRoutes from "./reportRoutes.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/admins", requireAdmin, getAllAdmins);
router.post("/admins", requireAdmin, createAdminAccount);
router.get("/stations", requireAdmin, getAllStationsAdmin);
router.get("/chargers", requireAdmin, getAllChargersAdmin);
router.get("/users", requireAdmin, getAllUsersAdmin);
router.get("/users/:id", requireAdmin, getUserByIdAdmin);
router.use(reportRoutes);

export default router;

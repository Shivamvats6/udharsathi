import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { getDashboard } from "../controllers/dashboardController";

const router = Router();
router.get("/", asyncHandler(getDashboard));
export default router;

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/settingsController";

const router = Router();
router.get("/", asyncHandler(ctrl.getSettings));
router.put("/", asyncHandler(ctrl.updateSettings));
export default router;

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/notificationController";

const router = Router();
router.get("/", asyncHandler(ctrl.listNotifications));
router.post("/:id/read", asyncHandler(ctrl.markNotificationRead));
export default router;

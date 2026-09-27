import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/backupController";

const router = Router();
router.post("/now", asyncHandler(ctrl.backupNow));
router.get("/list", asyncHandler(ctrl.listBackups));
router.post("/restore/:fileId", asyncHandler(ctrl.restoreBackup));
export default router;

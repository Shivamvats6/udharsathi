import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { generateReminderLink } from "../controllers/whatsappController";

const router = Router();
router.post("/reminder-link", asyncHandler(generateReminderLink));
export default router;

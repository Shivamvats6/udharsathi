import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/paymentController";

const router = Router();
router.get("/", asyncHandler(ctrl.listPayments));
router.post("/", asyncHandler(ctrl.createPayment));
export default router;

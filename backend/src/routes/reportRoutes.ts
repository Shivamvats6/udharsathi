import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/reportController";

const router = Router();
router.get("/daily", asyncHandler(ctrl.daily));
router.get("/monthly", asyncHandler(ctrl.monthly));
router.get("/outstanding", asyncHandler(ctrl.outstanding));
router.get("/overdue", asyncHandler(ctrl.overdue));
router.get("/statement/:customerId", asyncHandler(ctrl.statement));
router.get("/payment-history", asyncHandler(ctrl.paymentHistory));
export default router;

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/loanController";

const router = Router();
router.get("/", asyncHandler(ctrl.listLoans));
router.get("/:id", asyncHandler(ctrl.getLoan));
router.post("/", asyncHandler(ctrl.createLoan));
router.put("/:id", asyncHandler(ctrl.updateLoan));
router.delete("/:id", asyncHandler(ctrl.deleteLoan));
router.post("/waive-fine", asyncHandler(ctrl.waiveFine));
export default router;
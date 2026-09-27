import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import * as ctrl from "../controllers/customerController";

const router = Router();
router.get("/", asyncHandler(ctrl.listCustomers));
router.get("/:id", asyncHandler(ctrl.getCustomer));
router.post("/", asyncHandler(ctrl.createCustomer));
router.put("/:id", asyncHandler(ctrl.updateCustomer));
router.delete("/:id", asyncHandler(ctrl.archiveCustomer));
export default router;

import { Router } from "express";
import { login, googleOAuthUrl } from "../controllers/authController";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();
router.post("/login", authRateLimiter, login);
router.get("/google/url", googleOAuthUrl);
export default router;

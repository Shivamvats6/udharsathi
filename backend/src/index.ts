import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";
import { apiRateLimiter } from "./middleware/rateLimiter";

import authRoutes from "./routes/authRoutes";
import customerRoutes from "./routes/customerRoutes";
import loanRoutes from "./routes/loanRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import reportRoutes from "./routes/reportRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import whatsappRoutes from "./routes/whatsappRoutes";
import backupRoutes from "./routes/backupRoutes";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(apiRateLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok", storage: env.STORAGE_PROVIDER }));

app.use("/api/auth", authRoutes);

// Everything below requires a valid JWT (obtained via /api/auth/login)
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/customers", requireAuth, customerRoutes);
app.use("/api/loans", requireAuth, loanRoutes);
app.use("/api/payments", requireAuth, paymentRoutes);
app.use("/api/notifications", requireAuth, notificationRoutes);
app.use("/api/reports", requireAuth, reportRoutes);
app.use("/api/settings", requireAuth, settingsRoutes);
app.use("/api/whatsapp", requireAuth, whatsappRoutes);
app.use("/api/backup", requireAuth, backupRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`FinWise backend running on http://localhost:${env.PORT} (storage: ${env.STORAGE_PROVIDER})`);
});

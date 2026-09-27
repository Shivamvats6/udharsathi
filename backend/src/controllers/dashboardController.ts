import { Request, Response } from "express";
import { buildDashboard } from "../services/dashboardService";

export async function getDashboard(_req: Request, res: Response) {
  const data = await buildDashboard();
  res.json(data);
}

import { Request, Response } from "express";
import * as reportService from "../services/reportService";

export async function daily(req: Request, res: Response) {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  res.json(await reportService.dailyCollectionReport(date));
}

export async function monthly(req: Request, res: Response) {
  const now = new Date();
  const year = Number(req.query.year) || now.getFullYear();
  const month = Number(req.query.month) || now.getMonth() + 1;
  res.json(await reportService.monthlyCollectionReport(year, month));
}

export async function outstanding(_req: Request, res: Response) {
  res.json(await reportService.outstandingReport());
}

export async function overdue(_req: Request, res: Response) {
  res.json(await reportService.overdueReport());
}

export async function statement(req: Request, res: Response) {
  const result = await reportService.customerStatement(req.params.customerId);
  if (!result) return res.status(404).json({ error: "Customer not found" });
  res.json(result);
}

export async function paymentHistory(req: Request, res: Response) {
  const { customerId, loanId } = req.query as { customerId?: string; loanId?: string };
  res.json(await reportService.paymentHistoryReport({ customerId, loanId }));
}

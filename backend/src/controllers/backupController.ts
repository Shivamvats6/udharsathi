import { Request, Response } from "express";
import { repos } from "../repositories";
import * as drive from "../integrations/GoogleDriveClient";

export async function backupNow(_req: Request, res: Response) {
  const [customers, loans, payments] = await Promise.all([
    repos.customers.findAll(),
    repos.loans.findAll(),
    repos.payments.findAll(),
  ]);
  const result = await drive.backupNow({ customers, loans, payments, backedUpAt: new Date().toISOString() });
  res.json(result);
}

export async function listBackups(_req: Request, res: Response) {
  res.json(await drive.listBackups());
}

export async function restoreBackup(req: Request, res: Response) {
  const data = await drive.restoreBackup(req.params.fileId);
  res.json({ message: "Backup fetched. Manual review recommended before overwriting live data.", data });
}

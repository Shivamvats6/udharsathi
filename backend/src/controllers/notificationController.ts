import { Request, Response } from "express";
import { repos } from "../repositories";

export async function listNotifications(_req: Request, res: Response) {
  res.json(await repos.notifications.findAll());
}

export async function markNotificationRead(req: Request, res: Response) {
  await repos.notifications.markRead(req.params.id);
  res.status(204).send();
}

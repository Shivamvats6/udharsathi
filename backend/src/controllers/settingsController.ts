import { Request, Response } from "express";
import { repos } from "../repositories";

export async function getSettings(_req: Request, res: Response) {
  res.json(await repos.settings.get());
}

export async function updateSettings(req: Request, res: Response) {
  res.json(await repos.settings.update(req.body));
}

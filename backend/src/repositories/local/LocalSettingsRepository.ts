import { SettingsRepository } from "../interfaces";
import { FinancerSettings } from "../../types";
import fs from "fs";
import path from "path";
import { seedSettings } from "../../data/seedData";

const FILE = path.join(__dirname, "..", "..", "data", "settings.json");

export class LocalSettingsRepository implements SettingsRepository {
  async get(): Promise<FinancerSettings> {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, JSON.stringify(seedSettings, null, 2));
    }
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
  }
  async update(data: Partial<FinancerSettings>): Promise<FinancerSettings> {
    const current = await this.get();
    const updated = { ...current, ...data };
    fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));
    return updated;
  }
}

import { SettingsRepository } from "../interfaces";
import { FinancerSettings } from "../../types";
import { readSheetAsObjects, appendRows, ensureSheetsExist } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { seedSettings } from "../../data/seedData";
import { getSheetsClient } from "../../integrations/GoogleSheetsClient";
import { env } from "../../config/env";

const TAB = "Settings";

/** Settings is stored as key/value pairs (one row per field) for easy manual editing in Sheets. */
function flatten(settings: FinancerSettings): Record<string, string> {
  return {
    name: settings.name,
    businessName: settings.businessName,
    mobile: settings.mobile,
    whatsappNumber: settings.whatsappNumber,
    email: settings.email,
    address: settings.address,
    language: settings.language,
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    whatsappDefaultMessageHi: settings.whatsappDefaultMessageHi,
    whatsappDefaultMessageEn: settings.whatsappDefaultMessageEn,
    "notifications.push": String(settings.notifications.push),
    "notifications.dueDateReminders": String(settings.notifications.dueDateReminders),
    "notifications.overdueAlerts": String(settings.notifications.overdueAlerts),
    "notifications.weeklySummary": String(settings.notifications.weeklySummary),
  };
}

function unflatten(rows: { key: string; value: string }[]): FinancerSettings {
  const map: Record<string, string> = {};
  rows.forEach((r) => (map[r.key] = r.value));
  return {
    name: map.name,
    businessName: map.businessName,
    mobile: map.mobile,
    whatsappNumber: map.whatsappNumber,
    email: map.email,
    address: map.address,
    language: (map.language as "en" | "hi") || "en",
    currency: map.currency || "INR",
    dateFormat: map.dateFormat || "DD MMM YYYY",
    whatsappDefaultMessageHi: map.whatsappDefaultMessageHi,
    whatsappDefaultMessageEn: map.whatsappDefaultMessageEn,
    notifications: {
      push: map["notifications.push"] === "true",
      dueDateReminders: map["notifications.dueDateReminders"] === "true",
      overdueAlerts: map["notifications.overdueAlerts"] === "true",
      weeklySummary: map["notifications.weeklySummary"] === "true",
    },
  };
}

export class GoogleSettingsRepository implements SettingsRepository {
  async get(): Promise<FinancerSettings> {
    const rows = await readSheetAsObjects<{ key: string; value: string }>(TAB);
    if (rows.length === 0) {
      await this.update(seedSettings);
      return seedSettings;
    }
    return unflatten(rows);
  }
  async update(data: Partial<FinancerSettings>): Promise<FinancerSettings> {
    const current = await this.get().catch(() => seedSettings);
    const merged = { ...current, ...data };
    const flat = flatten(merged);
    const sheets = getSheetsClient();
    // Overwrite the whole (small) key/value tab - simplest correct approach for settings.
    await sheets.spreadsheets.values.clear({ spreadsheetId: env.GOOGLE_SPREADSHEET_ID!, range: `${TAB}!A:B` });
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.GOOGLE_SPREADSHEET_ID!,
      range: `${TAB}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["key", "value"], ...Object.entries(flat)] },
    });
    return merged;
  }
}

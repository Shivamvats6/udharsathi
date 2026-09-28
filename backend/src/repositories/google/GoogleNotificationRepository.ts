import { NotificationRepository } from "../interfaces";
import { AppNotification } from "../../types";
import {
  readSheetAsObjects,
  appendRow,
  updateRowById,
  deleteRowsByField,
} from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId, nowISO } from "../../utils/id";

const TAB = "Notifications";
const HEADER = SHEET_HEADERS[TAB];

function toNotif(row: Record<string, string>): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotification["type"],
    customerId: row.customerId || undefined,
    loanId: row.loanId || undefined,
    title: row.title,
    message: row.message,
    read: row.read === "true" || row.read === "TRUE",
    createdAt: row.createdAt,
  };
}

export class GoogleNotificationRepository implements NotificationRepository {
  async findAll(): Promise<AppNotification[]> {
    const rows = await readSheetAsObjects<Record<string, string>>(TAB);
    return rows.map(toNotif).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  async create(data: Omit<AppNotification, "id" | "createdAt" | "read">): Promise<AppNotification> {
    const rec: AppNotification = { ...data, id: generateId("notif"), createdAt: nowISO(), read: false };
    await appendRow(TAB, HEADER.map((h) => ((rec as any)[h] ?? "")));
    return rec;
  }
  async markRead(id: string): Promise<void> {
    const all = await this.findAll();
    const existing = all.find((n) => n.id === id);
    if (!existing) return;
    await updateRowById(TAB, "A", id, HEADER, { ...existing, read: "true" } as any);
  }
  async deleteByLoan(loanId: string): Promise<void> {
    await deleteRowsByField(TAB, "loanId", loanId);
  }
}
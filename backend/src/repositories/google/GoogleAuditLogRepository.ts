import { AuditLogRepository } from "../interfaces";
import { AuditLogEntry } from "../../types";
import { readSheetAsObjects, appendRow } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId, nowISO } from "../../utils/id";

const TAB = "AuditLogs";
const HEADER = SHEET_HEADERS[TAB];

export class GoogleAuditLogRepository implements AuditLogRepository {
  async findAll(): Promise<AuditLogEntry[]> {
    return readSheetAsObjects<AuditLogEntry>(TAB);
  }
  async create(data: Omit<AuditLogEntry, "id" | "performedAt">): Promise<AuditLogEntry> {
    const rec: AuditLogEntry = { ...data, id: generateId("audit"), performedAt: nowISO() };
    await appendRow(TAB, HEADER.map((h) => (rec as any)[h] ?? ""));
    return rec;
  }
}

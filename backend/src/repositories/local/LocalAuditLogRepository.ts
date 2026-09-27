import { AuditLogRepository } from "../interfaces";
import { AuditLogEntry } from "../../types";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId, nowISO } from "../../utils/id";

const store = new LocalJsonStore<AuditLogEntry>("audit_logs", []);

export class LocalAuditLogRepository implements AuditLogRepository {
  async findAll(): Promise<AuditLogEntry[]> {
    return store.all();
  }
  async create(data: Omit<AuditLogEntry, "id" | "performedAt">): Promise<AuditLogEntry> {
    const rec: AuditLogEntry = { ...data, id: generateId("audit"), performedAt: nowISO() };
    return store.insert(rec);
  }
}

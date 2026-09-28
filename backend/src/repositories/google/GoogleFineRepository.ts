import { FineRepository } from "../interfaces";
import { FineAdjustment } from "../../types";
import { readSheetAsObjects, appendRow, deleteRowsByField } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId, nowISO } from "../../utils/id";

const TAB = "FineAdjustments";
const HEADER = SHEET_HEADERS[TAB];

export class GoogleFineRepository implements FineRepository {
  async findByLoan(loanId: string): Promise<FineAdjustment[]> {
    const rows = await readSheetAsObjects<Record<string, string>>(TAB);
    return rows
      .map((r) => ({
        id: r.id,
        loanId: r.loanId,
        installmentNo: Number(r.installmentNo),
        originalFine: Number(r.originalFine),
        waivedAmount: Number(r.waivedAmount),
        reason: r.reason,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
      }))
      .filter((f) => f.loanId === loanId);
  }
  async create(data: Omit<FineAdjustment, "id" | "createdAt">): Promise<FineAdjustment> {
    const rec: FineAdjustment = { ...data, id: generateId("fine"), createdAt: nowISO() };
    await appendRow(TAB, HEADER.map((h) => (rec as any)[h] ?? ""));
    return rec;
  }
  async deleteByLoan(loanId: string): Promise<void> {
    await deleteRowsByField(TAB, "loanId", loanId);
  }
}
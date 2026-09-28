import { LoanRepository } from "../interfaces";
import { Loan } from "../../calculations/engine";
import { readSheetAsObjects, appendRow, updateRowById, deleteRowById } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId } from "../../utils/id";

const TAB = "Loans";
const HEADER = SHEET_HEADERS[TAB];

function toLoan(row: Record<string, string>): Loan {
  return {
    id: row.id,
    customerId: row.customerId,
    principalAmount: Number(row.principalAmount),
    interestRate: Number(row.interestRate),
    interestType: row.interestType as Loan["interestType"],
    startDate: row.startDate,
    endDate: row.endDate || undefined,
    tenureInstallments: row.tenureInstallments ? Number(row.tenureInstallments) : undefined,
    repaymentCycle: row.repaymentCycle as Loan["repaymentCycle"],
    customCycleDays: row.customCycleDays ? Number(row.customCycleDays) : undefined,
    firstPaymentDate: row.firstPaymentDate,
    repaymentAmount: Number(row.repaymentAmount),
    gracePeriodDays: Number(row.gracePeriodDays ?? 2),
    lateFineType: row.lateFineType as Loan["lateFineType"],
    lateFineAmount: Number(row.lateFineAmount),
    maximumFine: row.maximumFine ? Number(row.maximumFine) : undefined,
    nextPaymentMode: (row.nextPaymentMode as Loan["nextPaymentMode"]) || "scheduled_date",
    notes: row.notes,
  };
}

export class GoogleLoanRepository implements LoanRepository {
  async findAll(): Promise<Loan[]> {
    const rows = await readSheetAsObjects<Record<string, string>>(TAB);
    return rows.map(toLoan);
  }
  async findByCustomer(customerId: string): Promise<Loan[]> {
    const all = await this.findAll();
    return all.filter((l) => l.customerId === customerId);
  }
  async findById(id: string): Promise<Loan | null> {
    const all = await this.findAll();
    return all.find((l) => l.id === id) ?? null;
  }
  async create(data: Omit<Loan, "id">): Promise<Loan> {
    const loan: Loan = { ...data, id: generateId("loan") };
    await appendRow(TAB, HEADER.map((h) => (loan as any)[h] ?? ""));
    return loan;
  }
  async update(id: string, data: Partial<Loan>): Promise<Loan> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Loan not found");
    const updated = { ...existing, ...data };
    await updateRowById(TAB, "A", id, HEADER, updated as any);
    return updated;
  }
  async delete(id: string): Promise<void> {
    await deleteRowById(TAB, id);
  }
}
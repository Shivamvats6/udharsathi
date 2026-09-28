import { PaymentRepository } from "../interfaces";
import { Payment } from "../../types";
import { readSheetAsObjects, appendRow, deleteRowsByField } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId, nowISO } from "../../utils/id";

const TAB = "Payments";
const HEADER = SHEET_HEADERS[TAB];

function toPayment(row: Record<string, string>): Payment {
  return {
    id: row.id,
    customerId: row.customerId,
    loanId: row.loanId,
    installmentNo: row.installmentNo ? Number(row.installmentNo) : undefined,
    amount: Number(row.amount),
    paymentDate: row.paymentDate,
    paymentMode: row.paymentMode as Payment["paymentMode"],
    notes: row.notes,
    createdAt: row.createdAt,
  };
}

export class GooglePaymentRepository implements PaymentRepository {
  async findAll(): Promise<Payment[]> {
    const rows = await readSheetAsObjects<Record<string, string>>(TAB);
    return rows.map(toPayment);
  }
  async findByLoan(loanId: string): Promise<Payment[]> {
    return (await this.findAll()).filter((p) => p.loanId === loanId);
  }
  async findByCustomer(customerId: string): Promise<Payment[]> {
    return (await this.findAll()).filter((p) => p.customerId === customerId);
  }
  async create(data: Omit<Payment, "id" | "createdAt">): Promise<Payment> {
    const payment: Payment = { ...data, id: generateId("pay"), createdAt: nowISO() };
    await appendRow(TAB, HEADER.map((h) => (payment as any)[h] ?? ""));
    return payment;
  }
  async deleteByLoan(loanId: string): Promise<void> {
    await deleteRowsByField(TAB, "loanId", loanId);
  }
}
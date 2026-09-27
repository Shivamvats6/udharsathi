import { CustomerRepository } from "../interfaces";
import { Customer } from "../../types";
import { readSheetAsObjects, appendRow, updateRowById } from "../../integrations/GoogleSheetsClient";
import { SHEET_HEADERS } from "./sheetHeaders";
import { generateId, nowISO } from "../../utils/id";

const TAB = "Customers";
const HEADER = SHEET_HEADERS[TAB];

function toCustomer(row: Record<string, string>): Customer {
  return {
    id: row.id,
    customerCode: row.customerCode,
    name: row.name,
    phone: row.phone,
    address: row.address,
    preferredLanguage: (row.preferredLanguage as "en" | "hi") || "en",
    notes: row.notes,
    status: (row.status as "active" | "archived") || "active",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class GoogleCustomerRepository implements CustomerRepository {
  async findAll(): Promise<Customer[]> {
    const rows = await readSheetAsObjects<Record<string, string>>(TAB);
    return rows.map(toCustomer);
  }
  async findById(id: string): Promise<Customer | null> {
    const all = await this.findAll();
    return all.find((c) => c.id === id) ?? null;
  }
  async create(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const all = await this.findAll();
    const customer: Customer = {
      ...data,
      id: generateId("cust"),
      customerCode: `CUST${String(all.length + 1).padStart(3, "0")}`,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    await appendRow(TAB, HEADER.map((h) => (customer as any)[h] ?? ""));
    return customer;
  }
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Customer not found");
    const updated = { ...existing, ...data, updatedAt: nowISO() };
    await updateRowById(TAB, "A", id, HEADER, updated as any);
    return updated;
  }
  async archive(id: string): Promise<void> {
    await this.update(id, { status: "archived" });
  }
}

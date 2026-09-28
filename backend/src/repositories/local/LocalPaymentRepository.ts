import { PaymentRepository } from "../interfaces";
import { Payment } from "../../types";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId, nowISO } from "../../utils/id";

const store = new LocalJsonStore<Payment>("payments", []);

export class LocalPaymentRepository implements PaymentRepository {
  async findAll(): Promise<Payment[]> {
    return store.all();
  }
  async findByLoan(loanId: string): Promise<Payment[]> {
    return store.findWhere((p) => p.loanId === loanId);
  }
  async findByCustomer(customerId: string): Promise<Payment[]> {
    return store.findWhere((p) => p.customerId === customerId);
  }
  async create(data: Omit<Payment, "id" | "createdAt">): Promise<Payment> {
    const payment: Payment = { ...data, id: generateId("pay"), createdAt: nowISO() };
    return store.insert(payment);
  }
  async deleteByLoan(loanId: string): Promise<void> {
    await store.deleteWhere((p) => p.loanId === loanId);
  }
}
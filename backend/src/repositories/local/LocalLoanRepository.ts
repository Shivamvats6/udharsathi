import { LoanRepository } from "../interfaces";
import { Loan } from "../../calculations/engine";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId } from "../../utils/id";
import { seedLoans } from "../../data/seedData";

const store = new LocalJsonStore<Loan>("loans", seedLoans);

export class LocalLoanRepository implements LoanRepository {
  async findAll(): Promise<Loan[]> {
    return store.all();
  }
  async findByCustomer(customerId: string): Promise<Loan[]> {
    return store.findWhere((l) => l.customerId === customerId);
  }
  async findById(id: string): Promise<Loan | null> {
    return store.findById(id);
  }
  async create(data: Omit<Loan, "id">): Promise<Loan> {
    const loan: Loan = { ...data, id: generateId("loan") };
    return store.insert(loan);
  }
  async update(id: string, data: Partial<Loan>): Promise<Loan> {
    return store.update(id, data);
  }
}

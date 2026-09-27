import { FineRepository } from "../interfaces";
import { FineAdjustment } from "../../types";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId, nowISO } from "../../utils/id";

const store = new LocalJsonStore<FineAdjustment>("fine_adjustments", []);

export class LocalFineRepository implements FineRepository {
  async findByLoan(loanId: string): Promise<FineAdjustment[]> {
    return store.findWhere((f) => f.loanId === loanId);
  }
  async create(data: Omit<FineAdjustment, "id" | "createdAt">): Promise<FineAdjustment> {
    const rec: FineAdjustment = { ...data, id: generateId("fine"), createdAt: nowISO() };
    return store.insert(rec);
  }
}

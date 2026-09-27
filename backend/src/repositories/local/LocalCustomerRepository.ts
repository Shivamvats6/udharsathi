import { CustomerRepository } from "../interfaces";
import { Customer } from "../../types";
import { LocalJsonStore } from "./LocalJsonStore";
import { generateId, nowISO } from "../../utils/id";
import { seedCustomers } from "../../data/seedData";

const store = new LocalJsonStore<Customer>("customers", seedCustomers);

export class LocalCustomerRepository implements CustomerRepository {
  async findAll(): Promise<Customer[]> {
    return store.all();
  }
  async findById(id: string): Promise<Customer | null> {
    return store.findById(id);
  }
  async create(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    const customers = await store.all();
    const nextNum = customers.length + 1;
    const customer: Customer = {
      ...data,
      id: generateId("cust"),
      customerCode: `CUST${String(nextNum).padStart(3, "0")}`,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    return store.insert(customer);
  }
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return store.update(id, { ...data, updatedAt: nowISO() });
  }
  async archive(id: string): Promise<void> {
    await store.update(id, { status: "archived", updatedAt: nowISO() } as Partial<Customer>);
  }
}

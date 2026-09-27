import { Request, Response } from "express";
import { repos } from "../repositories";
import { customerSchema } from "../validators/schemas";
import { getCustomerFinancialSummary } from "../services/loanService";

export async function listCustomers(req: Request, res: Response) {
  const customers = await repos.customers.findAll();
  const { search, status } = req.query as { search?: string; status?: string };

  const loans = await repos.loans.findAll();
  const enriched = await Promise.all(
    customers
      .filter((c) => c.status === "active")
      .filter((c) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || c.phone.includes(s) || (c.customerCode ?? "").toLowerCase().includes(s);
      })
      .map(async (c) => {
        const summary = await getCustomerFinancialSummary(c.id);
        const customerLoans = loans.filter((l) => l.customerId === c.id);
        return { ...c, summary, loanCount: customerLoans.length };
      })
  );
  res.json(enriched);
}

export async function getCustomer(req: Request, res: Response) {
  const customer = await repos.customers.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const summary = await getCustomerFinancialSummary(customer.id);
  const loans = await repos.loans.findByCustomer(customer.id);
  const payments = await repos.payments.findByCustomer(customer.id);
  res.json({ ...customer, summary, loans, payments });
}

export async function createCustomer(req: Request, res: Response) {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const customer = await repos.customers.create({ ...parsed.data, status: "active" });
  await repos.auditLogs.create({
    entity: "Customer",
    entityId: customer.id,
    action: "create",
    details: `Created customer ${customer.name}`,
  });
  res.status(201).json(customer);
}

export async function updateCustomer(req: Request, res: Response) {
  const parsed = customerSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const customer = await repos.customers.update(req.params.id, parsed.data);
  await repos.auditLogs.create({
    entity: "Customer",
    entityId: customer.id,
    action: "update",
    details: `Updated customer ${customer.name}`,
  });
  res.json(customer);
}

export async function archiveCustomer(req: Request, res: Response) {
  await repos.customers.archive(req.params.id);
  await repos.auditLogs.create({
    entity: "Customer",
    entityId: req.params.id,
    action: "archive",
    details: "Customer archived",
  });
  res.status(204).send();
}

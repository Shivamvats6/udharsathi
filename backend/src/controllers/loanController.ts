import { Request, Response } from "express";
import { repos } from "../repositories";
import { loanSchema, fineWaiverSchema } from "../validators/schemas";
import { getLoanWithSchedule } from "../services/loanService";

export async function listLoans(req: Request, res: Response) {
  const { customerId } = req.query as { customerId?: string };
  const loans = customerId ? await repos.loans.findByCustomer(customerId) : await repos.loans.findAll();
  res.json(loans);
}

export async function getLoan(req: Request, res: Response) {
  const result = await getLoanWithSchedule(req.params.id);
  if (!result) return res.status(404).json({ error: "Loan not found" });
  res.json(result);
}

export async function createLoan(req: Request, res: Response) {
  const parsed = loanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const loan = await repos.loans.create(parsed.data);
  await repos.auditLogs.create({
    entity: "Loan",
    entityId: loan.id,
    action: "create",
    details: `Created loan of ₹${loan.principalAmount} for customer ${loan.customerId}`,
  });
  res.status(201).json(loan);
}

export async function updateLoan(req: Request, res: Response) {
  const parsed = loanSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const loan = await repos.loans.update(req.params.id, parsed.data);
  await repos.auditLogs.create({ entity: "Loan", entityId: loan.id, action: "update", details: "Loan updated" });
  res.json(loan);
}

export async function deleteLoan(req: Request, res: Response) {
  const loan = await repos.loans.findById(req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });

  await repos.notifications.deleteByLoan(loan.id);
  await repos.fines.deleteByLoan(loan.id);
  await repos.payments.deleteByLoan(loan.id);
  await repos.loans.delete(loan.id);

  await repos.auditLogs.create({
    entity: "Loan",
    entityId: loan.id,
    action: "delete",
    details: `Deleted loan of ₹${loan.principalAmount} for customer ${loan.customerId}`,
  });
  res.status(204).send();
}

export async function waiveFine(req: Request, res: Response) {
  const parsed = fineWaiverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { loanId, installmentNo, waivedAmount, reason } = parsed.data;

  const result = await getLoanWithSchedule(loanId);
  if (!result) return res.status(404).json({ error: "Loan not found" });
  const installment = result.schedule.find((s) => s.installmentNo === installmentNo);
  if (!installment) return res.status(404).json({ error: "Installment not found" });

  const record = await repos.fines.create({
    loanId,
    installmentNo,
    originalFine: installment.lateFine,
    waivedAmount,
    reason,
  });
  await repos.auditLogs.create({
    entity: "Loan",
    entityId: loanId,
    action: "fine_waived",
    details: `Waived ₹${waivedAmount} fine on installment #${installmentNo}${reason ? ` (${reason})` : ""}`,
  });
  await repos.notifications.create({
    type: "fine_waived",
    loanId,
    title: "Fine Waived",
    message: `₹${waivedAmount} fine waived on installment #${installmentNo}`,
  });
  res.status(201).json(record);
}
import { Request, Response } from "express";
import { repos } from "../repositories";
import { paymentSchema } from "../validators/schemas";

export async function listPayments(req: Request, res: Response) {
  const { customerId, loanId } = req.query as { customerId?: string; loanId?: string };
  let payments = await repos.payments.findAll();
  if (customerId) payments = payments.filter((p) => p.customerId === customerId);
  if (loanId) payments = payments.filter((p) => p.loanId === loanId);
  res.json(payments);
}

export async function createPayment(req: Request, res: Response) {
  const parsed = paymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const payment = await repos.payments.create(parsed.data);

  await repos.auditLogs.create({
    entity: "Payment",
    entityId: payment.id,
    action: "create",
    details: `Recorded payment of ₹${payment.amount} via ${payment.paymentMode}`,
  });
  await repos.notifications.create({
    type: "payment_received",
    customerId: payment.customerId,
    loanId: payment.loanId,
    title: "Payment Received",
    message: `₹${payment.amount} received`,
  });
  res.status(201).json(payment);
}

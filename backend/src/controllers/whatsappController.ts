import { Request, Response } from "express";
import { repos } from "../repositories";
import { buildWhatsAppLink } from "../services/whatsappService";
import { getCustomerFinancialSummary } from "../services/loanService";
import { getLoanWithSchedule } from "../services/loanService";

export async function generateReminderLink(req: Request, res: Response) {
  const { customerId, loanId } = req.body as { customerId: string; loanId?: string };
  const customer = await repos.customers.findById(customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const settings = await repos.settings.get();
  const summary = await getCustomerFinancialSummary(customerId);

  let nextPaymentDate = "";
  let amountDue = 0;
  if (loanId) {
    const result = await getLoanWithSchedule(loanId);
    const nextUnpaid = result?.schedule.find((s) => s.status !== "paid");
    if (nextUnpaid) {
      nextPaymentDate = nextUnpaid.dueDate;
      amountDue = nextUnpaid.totalDue - nextUnpaid.paidAmount;
    }
  }

  const { url, message } = buildWhatsAppLink(customer.phone, customer.preferredLanguage, settings, {
    customer_name: customer.name,
    amount_due: amountDue || summary.totalOutstanding,
    next_payment_date: nextPaymentDate || "-",
    outstanding: summary.totalOutstanding,
    late_fee: summary.totalLateFees,
    total_due: amountDue || summary.totalOutstanding,
    business_name: settings.businessName,
  });

  await repos.notifications.create({
    type: "upcoming",
    customerId,
    loanId,
    title: "Reminder link generated",
    message: `WhatsApp reminder prepared for ${customer.name}`,
  });

  res.json({ url, message });
}

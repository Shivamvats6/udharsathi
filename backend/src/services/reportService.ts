import { repos } from "../repositories";
import { getLoanWithSchedule } from "./loanService";

export async function dailyCollectionReport(date: string) {
  const payments = await repos.payments.findAll();
  const dayPayments = payments.filter((p) => p.paymentDate === date);
  const customers = await repos.customers.findAll();
  return dayPayments.map((p) => ({
    ...p,
    customerName: customers.find((c) => c.id === p.customerId)?.name || "",
  }));
}

export async function monthlyCollectionReport(year: number, month: number) {
  const payments = await repos.payments.findAll();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthPayments = payments.filter((p) => p.paymentDate.startsWith(prefix));
  const totalCollected = monthPayments.reduce((s, p) => s + p.amount, 0);
  return { month: prefix, totalCollected, count: monthPayments.length, payments: monthPayments };
}

export async function outstandingReport(today: string | Date = new Date()) {
  const customers = await repos.customers.findAll();
  const loans = await repos.loans.findAll();
  const rows = [];
  for (const customer of customers) {
    const customerLoans = loans.filter((l) => l.customerId === customer.id);
    let outstanding = 0;
    for (const loan of customerLoans) {
      const result = await getLoanWithSchedule(loan.id, today);
      if (!result) continue;
      outstanding += result.schedule.reduce((s, i) => s + Math.max(i.totalDue - i.paidAmount, 0), 0);
    }
    if (outstanding > 0) rows.push({ customerId: customer.id, customerName: customer.name, outstanding });
  }
  return rows;
}

export async function overdueReport(today: string | Date = new Date()) {
  const customers = await repos.customers.findAll();
  const loans = await repos.loans.findAll();
  const rows = [];
  for (const customer of customers) {
    const customerLoans = loans.filter((l) => l.customerId === customer.id);
    for (const loan of customerLoans) {
      const result = await getLoanWithSchedule(loan.id, today);
      if (!result) continue;
      for (const inst of result.schedule) {
        if (inst.status === "overdue") {
          rows.push({
            customerId: customer.id,
            customerName: customer.name,
            loanId: loan.id,
            installmentNo: inst.installmentNo,
            dueDate: inst.dueDate,
            overdueDays: inst.overdueDays,
            totalDue: inst.totalDue,
          });
        }
      }
    }
  }
  return rows;
}

export async function customerStatement(customerId: string, today: string | Date = new Date()) {
  const customer = await repos.customers.findById(customerId);
  if (!customer) return null;
  const loans = await repos.loans.findByCustomer(customerId);
  const loanStatements = [];
  for (const loan of loans) {
    const result = await getLoanWithSchedule(loan.id, today);
    if (result) loanStatements.push({ loan, schedule: result.schedule });
  }
  const payments = await repos.payments.findByCustomer(customerId);
  return { customer, loans: loanStatements, payments };
}

export async function paymentHistoryReport(filters: { customerId?: string; loanId?: string }) {
  let payments = await repos.payments.findAll();
  if (filters.customerId) payments = payments.filter((p) => p.customerId === filters.customerId);
  if (filters.loanId) payments = payments.filter((p) => p.loanId === filters.loanId);
  return payments;
}

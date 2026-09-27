import { repos } from "../repositories";
import { getLoanWithSchedule } from "./loanService";
import { toDateOnly, diffInDays } from "../calculations/engine";

export async function buildDashboard(today: string | Date = new Date()) {
  const customers = await repos.customers.findAll();
  const loans = await repos.loans.findAll();

  let totalPrincipal = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalInterest = 0;
  let totalLateFees = 0;
  let totalWaivedFees = 0;

  let dueTodayCustomers = new Set<string>();
  let dueTodayAmount = 0;
  let dueTodayCollected = 0;

  let overdueCustomers = new Set<string>();
  let overdueAmount = 0;
  let overdueFine = 0;

  const upcoming: { customerId: string; customerName: string; dueDate: string; amount: number }[] = [];
  const todayDate = toDateOnly(today);
  const in7Days = new Date(todayDate.getTime() + 7 * 86400000);

  for (const loan of loans) {
    const result = await getLoanWithSchedule(loan.id, today);
    if (!result) continue;
    const { schedule } = result;
    totalPrincipal += loan.principalAmount;
    const customer = customers.find((c) => c.id === loan.customerId);

    for (const inst of schedule) {
      totalCollected += inst.paidAmount;
      totalLateFees += inst.lateFine;
      totalWaivedFees += inst.fineWaived;
      totalOutstanding += Math.max(inst.totalDue - inst.paidAmount, 0);

      if (inst.status === "due_today") {
        dueTodayCustomers.add(loan.customerId);
        dueTodayAmount += inst.totalDue;
        dueTodayCollected += inst.paidAmount;
      }
      if (inst.status === "overdue") {
        overdueCustomers.add(loan.customerId);
        overdueAmount += inst.totalDue - inst.paidAmount;
        overdueFine += inst.lateFine - inst.fineWaived;
      }
      const dueDateObj = toDateOnly(inst.dueDate);
      if (
        (inst.status === "upcoming" || inst.status === "due_today") &&
        dueDateObj.getTime() >= todayDate.getTime() &&
        dueDateObj.getTime() <= in7Days.getTime()
      ) {
        upcoming.push({
          customerId: loan.customerId,
          customerName: customer?.name || "",
          dueDate: inst.dueDate,
          amount: inst.totalDue,
        });
      }
    }
  }

  upcoming.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  return {
    summary: {
      totalPrincipal,
      totalCollected,
      totalOutstanding,
      totalInterest,
      totalLateFees,
      totalWaivedFees,
    },
    todayCollection: {
      dueCustomers: dueTodayCustomers.size,
      totalDue: dueTodayAmount,
      collected: dueTodayCollected,
      pending: Math.max(dueTodayAmount - dueTodayCollected, 0),
    },
    overdue: {
      overdueCustomers: overdueCustomers.size,
      overdueAmount,
      pendingFine: overdueFine,
    },
    upcoming: upcoming.slice(0, 10),
  };
}

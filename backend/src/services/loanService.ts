import { repos } from "../repositories";
import { generateRepaymentSchedule, Loan, ScheduleInstallment } from "../calculations/engine";

export async function getLoanWithSchedule(
  loanId: string,
  today: string | Date = new Date()
): Promise<{ loan: Loan; schedule: ScheduleInstallment[] } | null> {
  const loan = await repos.loans.findById(loanId);
  if (!loan) return null;
  const payments = await repos.payments.findByLoan(loanId);
  const fines = await repos.fines.findByLoan(loanId);
  const schedule = generateRepaymentSchedule(
    loan,
    today,
    payments.map((p) => ({ installmentNo: p.installmentNo, date: p.paymentDate, amount: p.amount })),
    fines.map((f) => ({ installmentNo: f.installmentNo, waivedAmount: f.waivedAmount }))
  );
  return { loan, schedule };
}

export async function getCustomerFinancialSummary(customerId: string, today: string | Date = new Date()) {
  const loans = await repos.loans.findByCustomer(customerId);
  let totalPrincipal = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalInterest = 0;
  let totalLateFees = 0;
  let totalWaivedFees = 0;

  for (const loan of loans) {
    const result = await getLoanWithSchedule(loan.id, today);
    if (!result) continue;
    const { schedule } = result;
    totalPrincipal += loan.principalAmount;
    for (const inst of schedule) {
      totalPaid += inst.paidAmount;
      totalLateFees += inst.lateFine;
      totalWaivedFees += inst.fineWaived;
      totalOutstanding += Math.max(inst.totalDue - inst.paidAmount, 0);
    }
  }

  return {
    totalLoans: loans.length,
    totalPrincipal,
    totalPaid,
    totalOutstanding,
    totalInterest,
    totalLateFees,
    totalWaivedFees,
  };
}

/**
 * Financial Calculation Engine
 * -----------------------------------------------------------------------
 * All money/date math for the app lives here, and ONLY here.
 * Nothing in controllers/services/UI should re-implement this logic.
 * Every function is pure (no I/O) so it is easy to unit test.
 */

export type InterestType = "fixed" | "percentage" | "monthly_percentage" | "custom";
export type RepaymentCycle =
  | "daily"
  | "every_2_days"
  | "every_3_days"
  | "every_7_days"
  | "every_10_days"
  | "every_15_days"
  | "every_30_days"
  | "monthly"
  | "custom";
export type NextPaymentMode = "scheduled_date" | "actual_payment_date";
export type FineType = "per_day" | "fixed_amount";

export interface Loan {
  id: string;
  customerId: string;
  principalAmount: number;
  interestRate: number;
  interestType: InterestType;
  startDate: string; // ISO date
  endDate?: string;
  tenureInstallments?: number;
  repaymentCycle: RepaymentCycle;
  customCycleDays?: number;
  firstPaymentDate: string;
  repaymentAmount: number;
  gracePeriodDays: number; // default 2
  lateFineType: FineType;
  lateFineAmount: number;
  maximumFine?: number;
  nextPaymentMode: NextPaymentMode;
  notes?: string;
}

export interface ScheduleInstallment {
  installmentNo: number;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  status:
    | "upcoming"
    | "due_today"
    | "paid"
    | "partially_paid"
    | "overdue"
    | "cancelled"
    | "fine_waived";
  overdueDays: number;
  lateFine: number;
  fineWaived: number;
  totalDue: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateOnly(d: string | Date): Date {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: string | Date, days: number): Date {
  const base = toDateOnly(date);
  return new Date(base.getTime() + days * DAY_MS);
}

export function diffInDays(a: string | Date, b: string | Date): number {
  const d1 = toDateOnly(a).getTime();
  const d2 = toDateOnly(b).getTime();
  return Math.round((d1 - d2) / DAY_MS);
}

function cycleDays(cycle: RepaymentCycle, customDays?: number): number | "monthly" {
  switch (cycle) {
    case "daily":
      return 1;
    case "every_2_days":
      return 2;
    case "every_3_days":
      return 3;
    case "every_7_days":
      return 7;
    case "every_10_days":
      return 10;
    case "every_15_days":
      return 15;
    case "every_30_days":
      return 30;
    case "monthly":
      return "monthly";
    case "custom":
      return customDays && customDays > 0 ? customDays : 1;
    default:
      return 1;
  }
}

/** ---------------------------- Interest ------------------------------ */

export function calculateInterest(loan: Pick<Loan, "principalAmount" | "interestRate" | "interestType">, periods = 1): number {
  const { principalAmount, interestRate, interestType } = loan;
  switch (interestType) {
    case "fixed":
      return round2(interestRate);
    case "percentage":
      return round2((principalAmount * interestRate) / 100);
    case "monthly_percentage":
      return round2(((principalAmount * interestRate) / 100) * periods);
    case "custom":
      return round2(interestRate);
    default:
      return 0;
  }
}

export function calculateTotalPayable(principalAmount: number, interest: number): number {
  return round2(principalAmount + interest);
}

export function calculateOutstanding(totalPayable: number, paid: number): number {
  return round2(Math.max(totalPayable - paid, 0));
}

/** ------------------------- Next payment date -------------------------- */

export function calculateNextPaymentDate(
  loan: Pick<Loan, "repaymentCycle" | "customCycleDays" | "nextPaymentMode">,
  referenceScheduledDate: string | Date,
  actualPaymentDate?: string | Date
): Date {
  const cd = cycleDays(loan.repaymentCycle, loan.customCycleDays);
  const base =
    loan.nextPaymentMode === "actual_payment_date" && actualPaymentDate
      ? actualPaymentDate
      : referenceScheduledDate;

  if (cd === "monthly") {
    const d = toDateOnly(base);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
  }
  return addDays(base, cd);
}

/** ------------------------------ Overdue -------------------------------- */

export function calculateOverdueDays(
  dueDate: string | Date,
  today: string | Date,
  gracePeriodDays: number
): number {
  const rawOverdue = diffInDays(today, dueDate) - gracePeriodDays;
  return Math.max(rawOverdue, 0);
}

/** ---------------------------- Late fine --------------------------------- */

export function calculateLateFine(
  overdueDays: number,
  fineType: FineType,
  fineAmount: number,
  maximumFine?: number
): number {
  if (overdueDays <= 0) return 0;
  let fine = fineType === "per_day" ? fineAmount * overdueDays : fineAmount;
  if (maximumFine !== undefined && maximumFine !== null) {
    fine = Math.min(fine, maximumFine);
  }
  return round2(fine);
}

export function calculateWaivedFine(fine: number, waiveAmount: number): number {
  return round2(Math.min(fine, Math.max(waiveAmount, 0)));
}

export function calculateTotalDue(installmentDue: number, lateFine: number, fineWaived = 0): number {
  return round2(Math.max(installmentDue + lateFine - fineWaived, 0));
}

/** ------------------------ Repayment schedule ---------------------------- */

export function generateRepaymentSchedule(
  loan: Loan,
  today: string | Date = new Date(),
  payments: { installmentNo?: number; date: string; amount: number }[] = [],
  fineAdjustments: { installmentNo: number; waivedAmount: number }[] = []
): ScheduleInstallment[] {
  const schedule: ScheduleInstallment[] = [];
  const totalInterest = calculateInterest(loan);
  const totalPayable = calculateTotalPayable(loan.principalAmount, totalInterest);
  const installmentCount =
    loan.tenureInstallments && loan.tenureInstallments > 0
      ? loan.tenureInstallments
      : Math.max(Math.ceil(totalPayable / loan.repaymentAmount), 1);

  let cursor: string | Date = loan.firstPaymentDate;
  const cd = cycleDays(loan.repaymentCycle, loan.customCycleDays);

  for (let i = 1; i <= installmentCount; i++) {
    const dueDate = i === 1 ? toDateOnly(loan.firstPaymentDate) : toDateOnly(cursor);
    const dueDateISO = dueDate.toISOString().slice(0, 10);

    const paidForInstallment = payments
      .filter((p) => p.installmentNo === i)
      .reduce((sum, p) => sum + p.amount, 0);

    const overdueDays = calculateOverdueDays(dueDateISO, today, loan.gracePeriodDays);
    let lateFine = calculateLateFine(overdueDays, loan.lateFineType, loan.lateFineAmount, loan.maximumFine);

    const waived = fineAdjustments
      .filter((f) => f.installmentNo === i)
      .reduce((sum, f) => sum + f.waivedAmount, 0);
    const fineWaived = calculateWaivedFine(lateFine, waived);

    const totalDue = calculateTotalDue(loan.repaymentAmount, lateFine, fineWaived);

    let status: ScheduleInstallment["status"] = "upcoming";
    const dayDiff = diffInDays(today, dueDateISO);
    if (paidForInstallment >= totalDue && totalDue > 0) status = "paid";
    else if (paidForInstallment > 0 && paidForInstallment < totalDue) status = "partially_paid";
    else if (fineWaived > 0 && fineWaived === lateFine && paidForInstallment === 0) status = "fine_waived";
    else if (dayDiff === 0) status = "due_today";
    else if (overdueDays > 0) status = "overdue";
    else status = "upcoming";

    schedule.push({
      installmentNo: i,
      dueDate: dueDateISO,
      dueAmount: loan.repaymentAmount,
      paidAmount: round2(paidForInstallment),
      status,
      overdueDays,
      lateFine,
      fineWaived,
      totalDue,
    });

    // advance cursor for next installment (schedule-date based generation)
    if (cd === "monthly") {
      const d = toDateOnly(dueDateISO);
      cursor = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()));
    } else {
      cursor = addDays(dueDateISO, cd);
    }
  }

  return schedule;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

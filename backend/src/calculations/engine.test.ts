import { describe, it, expect } from "vitest";
import {
  calculateInterest,
  calculateTotalPayable,
  calculateOutstanding,
  calculateOverdueDays,
  calculateLateFine,
  calculateWaivedFine,
  calculateTotalDue,
  calculateNextPaymentDate,
  generateRepaymentSchedule,
  Loan,
} from "./engine";

describe("calculateInterest", () => {
  it("percentage interest", () => {
    expect(calculateInterest({ principalAmount: 50000, interestRate: 2.5, interestType: "percentage" })).toBe(1250);
  });
  it("fixed interest", () => {
    expect(calculateInterest({ principalAmount: 50000, interestRate: 1000, interestType: "fixed" })).toBe(1000);
  });
  it("monthly percentage compounds by number of periods (simple, per-month)", () => {
    expect(
      calculateInterest({ principalAmount: 50000, interestRate: 2.5, interestType: "monthly_percentage" }, 3)
    ).toBe(3750);
  });
});

describe("calculateTotalPayable / outstanding", () => {
  it("computes total payable and outstanding", () => {
    const total = calculateTotalPayable(50000, 1250);
    expect(total).toBe(51250);
    expect(calculateOutstanding(total, 40000)).toBe(11250);
  });
});

describe("grace period + late fine (spec example)", () => {
  // Due 10 Oct, grace 2 days, fine 100/day
  it("no fine during grace period", () => {
    expect(calculateOverdueDays("2026-10-10", "2026-10-11", 2)).toBe(0);
    expect(calculateOverdueDays("2026-10-10", "2026-10-12", 2)).toBe(0);
  });
  it("fine starts on day 3 (13 Oct)", () => {
    const od = calculateOverdueDays("2026-10-10", "2026-10-13", 2);
    expect(od).toBe(1);
    expect(calculateLateFine(od, "per_day", 100)).toBe(100);
  });
  it("fine grows per day after grace", () => {
    expect(calculateLateFine(calculateOverdueDays("2026-10-10", "2026-10-14", 2), "per_day", 100)).toBe(200);
    expect(calculateLateFine(calculateOverdueDays("2026-10-10", "2026-10-15", 2), "per_day", 100)).toBe(300);
  });
  it("maximum fine caps the total", () => {
    expect(calculateLateFine(10, "per_day", 100, 500)).toBe(500);
  });
});

describe("fine waiver", () => {
  it("full waiver reduces total due to installment only", () => {
    const fine = 500;
    const waived = calculateWaivedFine(fine, 500);
    expect(waived).toBe(500);
    expect(calculateTotalDue(5000, fine, waived)).toBe(5000);
  });
  it("partial waiver", () => {
    const fine = 500;
    const waived = calculateWaivedFine(fine, 200);
    expect(waived).toBe(200);
    expect(calculateTotalDue(5000, fine, waived)).toBe(5300);
  });
});

describe("calculateNextPaymentDate", () => {
  const baseLoan = { repaymentCycle: "every_10_days" as const, nextPaymentMode: "scheduled_date" as const };
  it("scheduled-date mode: next = due + interval regardless of actual payment", () => {
    const next = calculateNextPaymentDate(baseLoan, "2026-10-10", "2026-10-12");
    expect(next.toISOString().slice(0, 10)).toBe("2026-10-20");
  });
  it("actual-payment-date mode: next = actual payment + interval", () => {
    const loan = { ...baseLoan, nextPaymentMode: "actual_payment_date" as const };
    const next = calculateNextPaymentDate(loan, "2026-10-10", "2026-10-12");
    expect(next.toISOString().slice(0, 10)).toBe("2026-10-22");
  });
});

describe("generateRepaymentSchedule", () => {
  const loan: Loan = {
    id: "L1",
    customerId: "C1",
    principalAmount: 30000,
    interestRate: 0,
    interestType: "fixed",
    startDate: "2026-09-30",
    firstPaymentDate: "2026-09-30",
    repaymentCycle: "every_10_days",
    repaymentAmount: 5000,
    gracePeriodDays: 2,
    lateFineType: "per_day",
    lateFineAmount: 100,
    tenureInstallments: 6,
    nextPaymentMode: "scheduled_date",
  };

  it("generates the exact dates from the spec example (every 10 days from 30 Sep)", () => {
    const schedule = generateRepaymentSchedule(loan, "2026-09-25", []);
    expect(schedule.map((s) => s.dueDate)).toEqual([
      "2026-09-30",
      "2026-10-10",
      "2026-10-20",
      "2026-10-30",
      "2026-11-09",
      "2026-11-19",
    ]);
  });

  it("marks a fully paid installment as paid", () => {
    const schedule = generateRepaymentSchedule(loan, "2026-09-30", [
      { installmentNo: 1, date: "2026-09-30", amount: 5000 },
    ]);
    expect(schedule[0].status).toBe("paid");
  });

  it("marks an unpaid past-due installment (beyond grace) as overdue with fine", () => {
    const schedule = generateRepaymentSchedule(loan, "2026-10-13", []);
    const inst = schedule.find((s) => s.dueDate === "2026-10-10")!;
    expect(inst.status).toBe("overdue");
    expect(inst.lateFine).toBe(100);
    expect(inst.totalDue).toBe(5100);
  });
});

import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  address: z.string().optional(),
  preferredLanguage: z.enum(["en", "hi"]).default("en"),
  notes: z.string().optional(),
});

export const loanSchema = z.object({
  customerId: z.string(),
  principalAmount: z.number().positive(),
  interestRate: z.number().min(0),
  interestType: z.enum(["fixed", "percentage", "monthly_percentage", "custom"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  tenureInstallments: z.number().int().positive().optional(),
  repaymentCycle: z.enum([
    "daily", "every_2_days", "every_3_days", "every_7_days", "every_10_days",
    "every_15_days", "every_30_days", "monthly", "custom",
  ]),
  customCycleDays: z.number().int().positive().optional(),
  firstPaymentDate: z.string(),
  repaymentAmount: z.number().positive(),
  gracePeriodDays: z.number().int().min(0).default(2),
  lateFineType: z.enum(["per_day", "fixed_amount"]),
  lateFineAmount: z.number().min(0),
  maximumFine: z.number().min(0).optional(),
  nextPaymentMode: z.enum(["scheduled_date", "actual_payment_date"]).default("scheduled_date"),
  notes: z.string().optional(),
});

export const paymentSchema = z.object({
  customerId: z.string(),
  loanId: z.string(),
  installmentNo: z.number().int().positive().optional(),
  amount: z.number().positive(),
  paymentDate: z.string(),
  paymentMode: z.enum(["cash", "upi", "bank_transfer", "other"]),
  notes: z.string().optional(),
});

export const fineWaiverSchema = z.object({
  loanId: z.string(),
  installmentNo: z.number().int().positive(),
  waivedAmount: z.number().min(0),
  reason: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

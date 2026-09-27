export type Language = "en" | "hi";
export type PaymentMode = "cash" | "upi" | "bank_transfer" | "other";

export interface Customer {
  id: string;
  customerCode?: string;
  name: string;
  phone: string;
  address?: string;
  preferredLanguage: Language;
  notes?: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  summary?: FinancialSummary;
  loanCount?: number;
  loans?: Loan[];
  payments?: Payment[];
}

export interface FinancialSummary {
  totalLoans: number;
  totalPrincipal: number;
  totalPaid: number;
  totalOutstanding: number;
  totalInterest: number;
  totalLateFees: number;
  totalWaivedFees: number;
}

export interface Loan {
  id: string;
  customerId: string;
  principalAmount: number;
  interestRate: number;
  interestType: "fixed" | "percentage" | "monthly_percentage" | "custom";
  startDate: string;
  endDate?: string;
  tenureInstallments?: number;
  repaymentCycle:
    | "daily" | "every_2_days" | "every_3_days" | "every_7_days" | "every_10_days"
    | "every_15_days" | "every_30_days" | "monthly" | "custom";
  customCycleDays?: number;
  firstPaymentDate: string;
  repaymentAmount: number;
  gracePeriodDays: number;
  lateFineType: "per_day" | "fixed_amount";
  lateFineAmount: number;
  maximumFine?: number;
  nextPaymentMode: "scheduled_date" | "actual_payment_date";
  notes?: string;
}

export interface ScheduleInstallment {
  installmentNo: number;
  dueDate: string;
  dueAmount: number;
  paidAmount: number;
  status: "upcoming" | "due_today" | "paid" | "partially_paid" | "overdue" | "cancelled" | "fine_waived";
  overdueDays: number;
  lateFine: number;
  fineWaived: number;
  totalDue: number;
}

export interface Payment {
  id: string;
  customerId: string;
  loanId: string;
  installmentNo?: number;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: "upcoming" | "due_today" | "overdue" | "fine_applied" | "payment_received" | "fine_waived";
  customerId?: string;
  loanId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface FinancerSettings {
  name: string;
  businessName: string;
  mobile: string;
  whatsappNumber: string;
  email: string;
  address: string;
  language: Language;
  currency: string;
  dateFormat: string;
  whatsappDefaultMessageHi: string;
  whatsappDefaultMessageEn: string;
  notifications: {
    push: boolean;
    dueDateReminders: boolean;
    overdueAlerts: boolean;
    weeklySummary: boolean;
  };
}

export interface DashboardData {
  summary: {
    totalPrincipal: number;
    totalCollected: number;
    totalOutstanding: number;
    totalInterest: number;
    totalLateFees: number;
    totalWaivedFees: number;
  };
  todayCollection: { dueCustomers: number; totalDue: number; collected: number; pending: number };
  overdue: { overdueCustomers: number; overdueAmount: number; pendingFine: number };
  upcoming: { customerId: string; customerName: string; dueDate: string; amount: number }[];
}

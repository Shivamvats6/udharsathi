import { Loan } from "../calculations/engine";
import { AppNotification, AuditLogEntry, Customer, FinancerSettings, FineAdjustment, Payment } from "../types";

export interface CustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: string): Promise<Customer | null>;
  create(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  archive(id: string): Promise<void>;
}

export interface LoanRepository {
  findAll(): Promise<Loan[]>;
  findByCustomer(customerId: string): Promise<Loan[]>;
  findById(id: string): Promise<Loan | null>;
  create(data: Omit<Loan, "id">): Promise<Loan>;
  update(id: string, data: Partial<Loan>): Promise<Loan>;
}

export interface PaymentRepository {
  findAll(): Promise<Payment[]>;
  findByLoan(loanId: string): Promise<Payment[]>;
  findByCustomer(customerId: string): Promise<Payment[]>;
  create(data: Omit<Payment, "id" | "createdAt">): Promise<Payment>;
}

export interface FineRepository {
  findByLoan(loanId: string): Promise<FineAdjustment[]>;
  create(data: Omit<FineAdjustment, "id" | "createdAt">): Promise<FineAdjustment>;
}

export interface NotificationRepository {
  findAll(): Promise<AppNotification[]>;
  create(data: Omit<AppNotification, "id" | "createdAt" | "read">): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<FinancerSettings>;
  update(data: Partial<FinancerSettings>): Promise<FinancerSettings>;
}

export interface AuditLogRepository {
  findAll(): Promise<AuditLogEntry[]>;
  create(data: Omit<AuditLogEntry, "id" | "performedAt">): Promise<AuditLogEntry>;
}

export interface RepositoryBundle {
  customers: CustomerRepository;
  loans: LoanRepository;
  payments: PaymentRepository;
  fines: FineRepository;
  notifications: NotificationRepository;
  settings: SettingsRepository;
  auditLogs: AuditLogRepository;
}

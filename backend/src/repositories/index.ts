import { env } from "../config/env";
import { RepositoryBundle } from "./interfaces";

import { LocalCustomerRepository } from "./local/LocalCustomerRepository";
import { LocalLoanRepository } from "./local/LocalLoanRepository";
import { LocalPaymentRepository } from "./local/LocalPaymentRepository";
import { LocalFineRepository } from "./local/LocalFineRepository";
import { LocalNotificationRepository } from "./local/LocalNotificationRepository";
import { LocalSettingsRepository } from "./local/LocalSettingsRepository";
import { LocalAuditLogRepository } from "./local/LocalAuditLogRepository";

import { GoogleCustomerRepository } from "./google/GoogleCustomerRepository";
import { GoogleLoanRepository } from "./google/GoogleLoanRepository";
import { GooglePaymentRepository } from "./google/GooglePaymentRepository";
import { GoogleFineRepository } from "./google/GoogleFineRepository";
import { GoogleNotificationRepository } from "./google/GoogleNotificationRepository";
import { GoogleSettingsRepository } from "./google/GoogleSettingsRepository";
import { GoogleAuditLogRepository } from "./google/GoogleAuditLogRepository";

function build(): RepositoryBundle {
  if (env.STORAGE_PROVIDER === "google") {
    return {
      customers: new GoogleCustomerRepository(),
      loans: new GoogleLoanRepository(),
      payments: new GooglePaymentRepository(),
      fines: new GoogleFineRepository(),
      notifications: new GoogleNotificationRepository(),
      settings: new GoogleSettingsRepository(),
      auditLogs: new GoogleAuditLogRepository(),
    };
  }
  return {
    customers: new LocalCustomerRepository(),
    loans: new LocalLoanRepository(),
    payments: new LocalPaymentRepository(),
    fines: new LocalFineRepository(),
    notifications: new LocalNotificationRepository(),
    settings: new LocalSettingsRepository(),
    auditLogs: new LocalAuditLogRepository(),
  };
}

export const repos = build();

/** Column headers for every tab in the master Google Spreadsheet (spec section 25). */
export const SHEET_HEADERS: Record<string, string[]> = {
  Customers: ["id", "customerCode", "name", "phone", "address", "preferredLanguage", "notes", "status", "createdAt", "updatedAt"],
  Loans: [
    "id", "customerId", "principalAmount", "interestRate", "interestType", "startDate", "endDate",
    "tenureInstallments", "repaymentCycle", "customCycleDays", "firstPaymentDate", "repaymentAmount",
    "gracePeriodDays", "lateFineType", "lateFineAmount", "maximumFine", "nextPaymentMode", "notes",
  ],
  Repayments: ["loanId", "installmentNo", "dueDate", "dueAmount", "status"],
  Payments: ["id", "customerId", "loanId", "installmentNo", "amount", "paymentDate", "paymentMode", "notes", "createdAt"],
  FineAdjustments: ["id", "loanId", "installmentNo", "originalFine", "waivedAmount", "reason", "createdAt", "createdBy"],
  Notifications: ["id", "type", "customerId", "loanId", "title", "message", "read", "createdAt"],
  Settings: ["key", "value"],
  AuditLogs: ["id", "entity", "entityId", "action", "details", "performedAt"],
};

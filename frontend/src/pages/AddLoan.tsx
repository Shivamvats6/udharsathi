import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Loan, ScheduleInstallment } from "@/types";
import { calculateInterest, calculateTotalPayable } from "@/calculations/engine";
import { formatCurrency } from "@/utils/format";

const CYCLES = [
  "daily", "every_2_days", "every_3_days", "every_7_days", "every_10_days",
  "every_15_days", "every_30_days", "monthly", "custom",
];

type CalcMode = "rate" | "total";

const emptyForm = (customerId = "", today = new Date().toISOString().slice(0, 10)) => ({
  customerId,
  principalAmount: "",
  interestType: "monthly_percentage",
  interestRate: "2.5",
  totalPayable: "", // used only when calcMode === "total"
  repaymentCycle: "every_10_days",
  customCycleDays: "",
  firstPaymentDate: today,
  repaymentAmount: "",
  gracePeriodDays: "2",
  lateFineType: "per_day",
  lateFineAmount: "100",
  maximumFine: "",
  tenureInstallments: "",
  nextPaymentMode: "scheduled_date",
  notes: "",
});

export function AddLoan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id } = useParams(); // present only on /loans/:id/edit
  const isEditMode = !!id;

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lite"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data,
  });

  // In edit mode, load the existing loan so the form can be pre-filled.
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["loan", id],
    queryFn: async () => (await api.get<{ loan: Loan; schedule: ScheduleInstallment[] }>(`/loans/${id}`)).data,
    enabled: isEditMode,
  });

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(emptyForm(params.get("customerId") || "", today));
  const [calcMode, setCalcMode] = useState<CalcMode>("rate");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill the form once the existing loan has loaded (edit mode only).
  // If the loan was previously saved with a directly-entered Total Payable
  // (stored internally as interestType "custom"), reopen it in "total" mode
  // with the total payable amount reconstructed - continuity for editing.
  useEffect(() => {
    if (existing?.loan) {
      const l = existing.loan;
      const wasTotalPayableMode = l.interestType === "custom";
      setCalcMode(wasTotalPayableMode ? "total" : "rate");
      setForm({
        customerId: l.customerId,
        principalAmount: String(l.principalAmount),
        interestType: wasTotalPayableMode ? "monthly_percentage" : l.interestType,
        interestRate: wasTotalPayableMode ? "2.5" : String(l.interestRate),
        totalPayable: wasTotalPayableMode ? String(l.principalAmount + l.interestRate) : "",
        repaymentCycle: l.repaymentCycle,
        customCycleDays: l.customCycleDays ? String(l.customCycleDays) : "",
        firstPaymentDate: l.firstPaymentDate?.slice(0, 10) || today,
        repaymentAmount: String(l.repaymentAmount),
        gracePeriodDays: String(l.gracePeriodDays),
        lateFineType: l.lateFineType,
        lateFineAmount: String(l.lateFineAmount),
        maximumFine: l.maximumFine !== undefined && l.maximumFine !== null ? String(l.maximumFine) : "",
        tenureInstallments: l.tenureInstallments ? String(l.tenureInstallments) : "",
        nextPaymentMode: l.nextPaymentMode,
        notes: l.notes || "",
      });
    }
  }, [existing]);

  // When calculating "By Total Payable": auto-derive the per-installment
  // repayment amount from Total Payable ÷ Tenure. The field stays editable
  // afterwards in case the financer wants to tweak it manually.
  useEffect(() => {
    if (calcMode !== "total") return;
    const total = Number(form.totalPayable);
    const tenure = Number(form.tenureInstallments);
    if (total > 0 && tenure > 0) {
      const perInstallment = Math.round(total / tenure);
      setForm((f) => ({ ...f, repaymentAmount: String(perInstallment) }));
    }
  }, [calcMode, form.totalPayable, form.tenureInstallments]);

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Live preview numbers shown to the financer while filling the form.
  const principalNum = Number(form.principalAmount) || 0;
  const ratePreviewInterest = calculateInterest({
    principalAmount: principalNum,
    interestRate: Number(form.interestRate) || 0,
    interestType: form.interestType as Loan["interestType"],
  });
  const ratePreviewTotal = calculateTotalPayable(principalNum, ratePreviewInterest);

  const totalPayableNum = Number(form.totalPayable) || 0;
  const totalModeInterest = Math.max(totalPayableNum - principalNum, 0);

  function buildPayload() {
    const principal = Number(form.principalAmount);
    let interestType = form.interestType;
    let interestRate = Number(form.interestRate);

    if (calcMode === "total") {
      // Store as a "custom" fixed interest amount that exactly reproduces
      // the Total Payable the financer typed in.
      interestType = "custom";
      interestRate = Math.max(Number(form.totalPayable) - principal, 0);
    }

    return {
      customerId: form.customerId,
      principalAmount: principal,
      interestType,
      interestRate,
      startDate: form.firstPaymentDate,
      firstPaymentDate: form.firstPaymentDate,
      repaymentCycle: form.repaymentCycle,
      customCycleDays: form.customCycleDays ? Number(form.customCycleDays) : undefined,
      repaymentAmount: Number(form.repaymentAmount),
      gracePeriodDays: Number(form.gracePeriodDays),
      lateFineType: form.lateFineType,
      lateFineAmount: Number(form.lateFineAmount),
      maximumFine: form.maximumFine ? Number(form.maximumFine) : undefined,
      tenureInstallments: form.tenureInstallments ? Number(form.tenureInstallments) : undefined,
      nextPaymentMode: form.nextPaymentMode,
      notes: form.notes,
    };
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      if (isEditMode && id) {
        await api.put(`/loans/${id}`, buildPayload());
        navigate(`/loans/${id}`);
      } else {
        await api.post("/loans", buildPayload());
        navigate(`/customers/${form.customerId}`);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  if (isEditMode && loadingExisting) {
    return <div className="text-center text-slate-400 py-20">{t("common.loading")}</div>;
  }

  const canSubmit =
    !!form.customerId &&
    !!form.principalAmount &&
    !!form.repaymentAmount &&
    (calcMode === "rate" || (!!form.totalPayable && !!form.tenureInstallments && totalPayableNum > principalNum));

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-slate-400"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-navy">
          {isEditMode ? t("loan.editLoan", "Edit Loan") : t("loan.addLoan")}
        </h1>
      </div>

      <div className="card p-4 space-y-3">
        <Field label={t("loan.customer")}>
          <select
            className="input-field disabled:bg-slate-50 disabled:text-slate-400"
            value={form.customerId}
            onChange={(e) => set("customerId", e.target.value)}
            disabled={isEditMode}
          >
            <option value="">-</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>
            ))}
          </select>
          {isEditMode && (
            <p className="text-[11px] text-slate-400 mt-1">Customer can't be changed once a loan is created.</p>
          )}
        </Field>

        <Field label={t("loan.principalAmount")}>
          <input className="input-field" type="number" value={form.principalAmount} onChange={(e) => set("principalAmount", e.target.value)} placeholder="₹ 50,000" />
        </Field>

        {/* --- Calculation mode toggle --- */}
        <Field label={t("loan.calcMode", "Calculate By")}>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCalcMode("rate")}
              className={`rounded-xl py-2 text-sm font-semibold border ${
                calcMode === "rate" ? "bg-brand text-white border-brand" : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {t("loan.byInterestRate", "Interest Rate")}
            </button>
            <button
              type="button"
              onClick={() => setCalcMode("total")}
              className={`rounded-xl py-2 text-sm font-semibold border ${
                calcMode === "total" ? "bg-brand text-white border-brand" : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {t("loan.byTotalPayable", "Total Payable")}
            </button>
          </div>
        </Field>

        {calcMode === "rate" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("loan.interestType")}>
                <select className="input-field" value={form.interestType} onChange={(e) => set("interestType", e.target.value)}>
                  <option value="fixed">{t("loan.fixed")}</option>
                  <option value="percentage">{t("loan.percentage")}</option>
                  <option value="monthly_percentage">{t("loan.monthlyPercentage")}</option>
                  <option value="custom">{t("loan.custom")}</option>
                </select>
              </Field>
              <Field label={t("loan.interestRate")}>
                <input className="input-field" type="number" step="0.01" value={form.interestRate} onChange={(e) => set("interestRate", e.target.value)} />
              </Field>
            </div>
            {principalNum > 0 && (
              <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-sm flex justify-between">
                <span className="text-slate-500">{t("loan.totalPayable", "Total Payable")}</span>
                <span className="font-bold text-brand">{formatCurrency(ratePreviewTotal)}</span>
              </div>
            )}
          </>
        ) : (
          <>
            <Field label={t("loan.totalPayable", "Total Payable")}>
              <input
                className="input-field"
                type="number"
                value={form.totalPayable}
                onChange={(e) => set("totalPayable", e.target.value)}
                placeholder="₹ 55,000"
              />
            </Field>
            {principalNum > 0 && totalPayableNum > 0 && (
              <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-sm flex justify-between">
                <span className="text-slate-500">{t("loan.interestAmount", "Interest Amount")}</span>
                <span className="font-bold text-brand">{formatCurrency(totalModeInterest)}</span>
              </div>
            )}
          </>
        )}

        <Field label={t("loan.repaymentCycle")}>
          <select className="input-field" value={form.repaymentCycle} onChange={(e) => set("repaymentCycle", e.target.value)}>
            {CYCLES.map((c) => (
              <option key={c} value={c}>{t(`loan.${camel(c)}`, c)}</option>
            ))}
          </select>
        </Field>
        {form.repaymentCycle === "custom" && (
          <Field label="Every X days">
            <input className="input-field" type="number" value={form.customCycleDays} onChange={(e) => set("customCycleDays", e.target.value)} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("loan.firstPaymentDate")}>
            <input className="input-field" type="date" value={form.firstPaymentDate} onChange={(e) => set("firstPaymentDate", e.target.value)} />
          </Field>
          <Field label="Tenure (installments)">
            <input
              className="input-field"
              type="number"
              value={form.tenureInstallments}
              onChange={(e) => set("tenureInstallments", e.target.value)}
              placeholder={calcMode === "total" ? "e.g. 11" : "optional"}
            />
          </Field>
        </div>

        <Field label={t("loan.repaymentAmount")}>
          <input
            className="input-field"
            type="number"
            value={form.repaymentAmount}
            onChange={(e) => set("repaymentAmount", e.target.value)}
            placeholder="₹ 5,000"
          />
          {calcMode === "total" && form.totalPayable && form.tenureInstallments && (
            <p className="text-[11px] text-slate-400 mt-1">
              {t(
                "loan.autoCalcNote",
                "Auto-calculated from Total Payable ÷ Tenure — change it manually if needed."
              )}
            </p>
          )}
        </Field>

        <Field label={t("loan.gracePeriod")}>
          <input className="input-field" type="number" value={form.gracePeriodDays} onChange={(e) => set("gracePeriodDays", e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t("loan.lateFineType")}>
            <select className="input-field" value={form.lateFineType} onChange={(e) => set("lateFineType", e.target.value)}>
              <option value="per_day">{t("loan.perDay")}</option>
              <option value="fixed_amount">{t("loan.fixedAmount")}</option>
            </select>
          </Field>
          <Field label={t("loan.lateFineAmount")}>
            <input className="input-field" type="number" value={form.lateFineAmount} onChange={(e) => set("lateFineAmount", e.target.value)} />
          </Field>
        </div>

        <Field label={t("loan.maximumFine")}>
          <input className="input-field" type="number" value={form.maximumFine} onChange={(e) => set("maximumFine", e.target.value)} />
        </Field>

        <Field label={t("loan.notes")}>
          <textarea className="input-field" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        {error && <div className="text-xs text-danger bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <button onClick={handleSubmit} disabled={saving || !canSubmit} className="btn-primary w-full">
          {saving ? t("common.loading") : isEditMode ? t("common.save") : t("loan.createLoan")}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
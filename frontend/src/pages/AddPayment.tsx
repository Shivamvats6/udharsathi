import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Loan, ScheduleInstallment } from "@/types";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSettings } from "@/context/SettingsContext";

export function AddPayment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [params] = useSearchParams();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lite"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data,
  });

  const [customerId, setCustomerId] = useState(params.get("customerId") || "");
  const [loanId, setLoanId] = useState(params.get("loanId") || "");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState("upi");
  const [notes, setNotes] = useState("");
  const [includeLateFine, setIncludeLateFine] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: customerLoans = [] } = useQuery({
    queryKey: ["loans-by-customer", customerId],
    queryFn: async () => (await api.get<Loan[]>("/loans", { params: { customerId } })).data,
    enabled: !!customerId,
  });

  const { data: loanDetail } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => (await api.get<{ loan: Loan; schedule: ScheduleInstallment[] }>(`/loans/${loanId}`)).data,
    enabled: !!loanId,
  });

  const nextInstallment = loanDetail?.schedule.find((s) => s.status !== "paid");

  useEffect(() => {
    if (nextInstallment) {
      const suggested = includeLateFine ? nextInstallment.totalDue : nextInstallment.dueAmount;
      setAmount(String(Math.max(suggested - nextInstallment.paidAmount, 0)));
    }
  }, [nextInstallment?.installmentNo, includeLateFine]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.post("/payments", {
        customerId, loanId, amount: Number(amount), paymentDate, paymentMode, notes,
        installmentNo: nextInstallment?.installmentNo,
      });
      navigate(`/customers/${customerId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-slate-400"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-navy">{t("payment.addPayment")}</h1>
      </div>

      <div className="card p-4 space-y-3">
        <div>
          <label className="label-field">{t("payment.customer")}</label>
          <select className="input-field" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setLoanId(""); }}>
            <option value="">-</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.customerCode})</option>)}
          </select>
        </div>

        <div>
          <label className="label-field">{t("payment.loan")}</label>
          <select className="input-field" value={loanId} onChange={(e) => setLoanId(e.target.value)} disabled={!customerId}>
            <option value="">-</option>
            {customerLoans.map((l) => <option key={l.id} value={l.id}>{l.notes || "Loan"} - {formatCurrency(l.principalAmount)}</option>)}
          </select>
        </div>

        {nextInstallment && (
          <div className="bg-blue-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">{t("loan.dueDate")}</span><span className="font-semibold">{formatDate(nextInstallment.dueDate, settings?.dateFormat)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">{t("loan.dueAmount")}</span><span className="font-semibold">{formatCurrency(nextInstallment.dueAmount)}</span></div>
            {nextInstallment.lateFine > 0 && (
              <div className="flex justify-between text-danger"><span>{t("loan.lateFine")}</span><span className="font-semibold">{formatCurrency(nextInstallment.lateFine)}</span></div>
            )}
            <div className="flex justify-between font-bold border-t border-blue-100 mt-1 pt-1"><span>{t("loan.totalDue")}</span><span>{formatCurrency(nextInstallment.totalDue)}</span></div>
          </div>
        )}

        {nextInstallment && nextInstallment.lateFine > 0 && (
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={includeLateFine} onChange={(e) => setIncludeLateFine(e.target.checked)} />
            {t("payment.includeLateFine")} ({formatCurrency(nextInstallment.lateFine)})
          </label>
        )}

        <div>
          <label className="label-field">{t("payment.amount")}</label>
          <input className="input-field" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field">{t("payment.paymentDate")}</label>
            <input className="input-field" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t("payment.paymentMode")}</label>
            <select className="input-field" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              <option value="cash">{t("payment.cash")}</option>
              <option value="upi">{t("payment.upi")}</option>
              <option value="bank_transfer">{t("payment.bankTransfer")}</option>
              <option value="other">{t("payment.other")}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-field">{t("payment.notes")}</label>
          <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <div className="text-xs text-danger bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <button onClick={handleSave} disabled={saving || !customerId || !loanId || !amount} className="btn-primary w-full">
          {saving ? t("common.loading") : t("payment.save")}
        </button>
      </div>
    </div>
  );
}

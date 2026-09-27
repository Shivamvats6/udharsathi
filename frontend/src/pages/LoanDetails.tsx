import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Gift, Plus, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { Loan, ScheduleInstallment } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSettings } from "@/context/SettingsContext";

export function LoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const [waiveTarget, setWaiveTarget] = useState<ScheduleInstallment | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["loan", id],
    queryFn: async () => (await api.get<{ loan: Loan; schedule: ScheduleInstallment[] }>(`/loans/${id}`)).data,
    enabled: !!id,
  });

  if (isLoading || !data) return <div className="text-center text-slate-400 py-20">{t("common.loading")}</div>;

  const { loan, schedule } = data;
  const totalPayable = schedule.reduce((s, i) => s + i.dueAmount, 0);
  const totalPaid = schedule.reduce((s, i) => s + i.paidAmount, 0);
  const outstanding = schedule.reduce((s, i) => s + Math.max(i.totalDue - i.paidAmount, 0), 0);
  const nextInstallment = schedule.find((i) => i.status !== "paid");

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-slate-400"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-navy flex-1">{t("loan.loanDetails")}</h1>
        <Link
          to={`/loans/${loan.id}/edit`}
          className="flex items-center gap-1.5 text-sm font-semibold text-brand bg-blue-50 rounded-xl px-3 py-1.5"
        >
          <Pencil size={14} /> {t("customerDetails.edit")}
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-navy">{loan.notes || "Loan"}</span>
          <StatusBadge status={outstanding > 0 ? "active" : "paid"} />
        </div>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <Stat label={t("loan.principal")} value={formatCurrency(loan.principalAmount)} />
          <Stat label="Interest" value={`${loan.interestRate}% (${t(`loan.${camel(loan.interestType)}`)})`} />
          <Stat label={t("loan.totalPayable")} value={formatCurrency(totalPayable)} />
          <Stat label={t("loan.amountPaid")} value={formatCurrency(totalPaid)} color="text-success" />
          <Stat label={t("loan.outstanding")} value={formatCurrency(outstanding)} color="text-warning" />
        </div>
      </div>

      {nextInstallment && (
        <div className="card p-4">
          <h3 className="font-bold text-navy mb-2">{t("loan.nextPayment")}</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <Stat label={t("loan.dueDate")} value={formatDate(nextInstallment.dueDate, settings?.dateFormat)} />
            <Stat label={t("loan.dueAmount")} value={formatCurrency(nextInstallment.dueAmount)} />
            <Stat label={t("loan.overdueDays")} value={String(nextInstallment.overdueDays)} color={nextInstallment.overdueDays > 0 ? "text-danger" : "text-navy"} />
            <Stat label={t("loan.lateFine")} value={formatCurrency(nextInstallment.lateFine)} color="text-danger" />
            <Stat label={t("loan.totalDue")} value={formatCurrency(nextInstallment.totalDue - nextInstallment.paidAmount)} color="text-warning" />
          </div>
          <div className="flex gap-2 mt-3">
            <Link to={`/payments/new?loanId=${loan.id}&customerId=${loan.customerId}`} className="btn-success flex items-center gap-1.5 text-sm flex-1 justify-center">
              <Plus size={15} /> {t("customerDetails.addPayment")}
            </Link>
            {nextInstallment.lateFine > 0 && (
              <button onClick={() => setWaiveTarget(nextInstallment)} className="flex items-center gap-1.5 text-sm flex-1 justify-center bg-amber-50 text-warning font-semibold rounded-xl px-4 py-2.5">
                <Gift size={15} /> {t("loan.waiveFine")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <h3 className="font-bold text-navy p-4 pb-2">{t("loan.repaymentSchedule")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 text-xs border-y border-slate-100">
                <th className="px-4 py-2 font-medium">{t("loan.dueDate")}</th>
                <th className="px-4 py-2 font-medium">{t("loan.dueAmount")}</th>
                <th className="px-4 py-2 font-medium">{t("payment.amount")}</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((inst) => (
                <tr key={inst.installmentNo} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2.5">{formatDate(inst.dueDate, settings?.dateFormat)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(inst.dueAmount)}</td>
                  <td className="px-4 py-2.5">{formatCurrency(inst.paidAmount)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={inst.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {waiveTarget && (
        <WaiveFineModal
          loanId={loan.id}
          installment={waiveTarget}
          onClose={() => setWaiveTarget(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["loan", id] })}
        />
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-navy" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className={`font-semibold ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function WaiveFineModal({
  loanId, installment, onClose, onSaved,
}: { loanId: string; installment: ScheduleInstallment; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(String(installment.lateFine));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.post("/loans/waive-fine", {
        loanId, installmentNo: installment.installmentNo, waivedAmount: Number(amount), reason,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5">
        <h2 className="font-bold text-navy mb-3">{t("loan.waiveFine")}</h2>
        <div className="text-sm text-slate-500 mb-3">
          Original fine: <span className="font-semibold text-danger">{formatCurrency(installment.lateFine)}</span>
        </div>
        <label className="label-field">Waive amount</label>
        <input className="input-field mb-3" type="number" max={installment.lateFine} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <label className="label-field">Reason (optional)</label>
        <input className="input-field mb-4" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">{t("common.cancel")}</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? t("common.loading") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
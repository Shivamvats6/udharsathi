import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, MessageCircle, Pencil, Plus, Send, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Loan } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSettings } from "@/context/SettingsContext";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";

export function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [tab, setTab] = useState<"overview" | "loans" | "payments">("overview");
  const [showEdit, setShowEdit] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => (await api.get<Customer>(`/customers/${id}`)).data,
    enabled: !!id,
  });

  async function sendReminder(loanId?: string) {
    const res = await api.post("/whatsapp/reminder-link", { customerId: id, loanId });
    window.open(res.data.url, "_blank");
  }

  if (isLoading || !customer) return <div className="text-center text-slate-400 py-20">{t("common.loading")}</div>;

  const summary = customer.summary!;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-slate-400"><ArrowLeft size={20} /></button>
        <h1 className="text-lg font-bold text-navy truncate">{customer.name}</h1>
      </div>

      {/* Profile card */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-brand flex items-center justify-center font-bold text-xl shrink-0">
            {customer.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-navy">{customer.name}</span>
              <StatusBadge status={summary.totalOutstanding > 0 ? "active" : "paid"} />
            </div>
            <div className="text-xs text-slate-400">{customer.customerCode}</div>
            {customer.address && (
              <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {customer.address}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mt-4">
          <a href={`tel:${customer.phone}`} className="flex flex-col items-center gap-1 bg-blue-50 rounded-xl py-2.5 text-brand">
            <Phone size={16} /> <span className="text-[11px] font-semibold">{t("customerDetails.call")}</span>
          </a>
          <button onClick={() => sendReminder()} className="flex flex-col items-center gap-1 bg-emerald-50 rounded-xl py-2.5 text-success">
            <MessageCircle size={16} /> <span className="text-[11px] font-semibold">{t("customerDetails.whatsapp")}</span>
          </button>
          <button
            onClick={() => setShowEdit(true)}
            className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl py-2.5 text-slate-500"
          >
            <Pencil size={16} /> <span className="text-[11px] font-semibold">{t("customerDetails.edit")}</span>
          </button>
          <Link to={`/loans/new?customerId=${customer.id}`} className="flex flex-col items-center gap-1 bg-teal/10 rounded-xl py-2.5 text-teal">
            <Plus size={16} /> <span className="text-[11px] font-semibold">{t("customerDetails.addLoan")}</span>
          </Link>
        </div>
      </div>

      {/* Financial summary */}
      <div className="card p-4">
        <div className="grid grid-cols-3 gap-y-3 text-center">
          <SummaryStat label={t("customerDetails.totalLoans")} value={String(summary.totalLoans)} />
          <SummaryStat label={t("customerDetails.totalPrincipal")} value={formatCurrency(summary.totalPrincipal)} />
          <SummaryStat label={t("customerDetails.totalPaid")} value={formatCurrency(summary.totalPaid)} color="text-success" />
          <SummaryStat label={t("customerDetails.outstanding")} value={formatCurrency(summary.totalOutstanding)} color="text-warning" />
          <SummaryStat label={t("customerDetails.lateFees")} value={formatCurrency(summary.totalLateFees)} color="text-danger" />
          <SummaryStat label={t("customerDetails.waivedFees")} value={formatCurrency(summary.totalWaivedFees)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100 w-fit">
        {(["overview", "loans", "payments"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
              tab === tabKey ? "bg-brand text-white" : "text-slate-500"
            }`}
          >
            {t(`customerDetails.${tabKey}`)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card p-4">
          <h3 className="font-bold text-navy mb-3">{t("customerDetails.activeLoans")}</h3>
          <div className="space-y-2">
            {(customer.loans || []).map((loan) => (
              <LoanRow key={loan.id} loan={loan} onReminder={() => sendReminder(loan.id)} />
            ))}
            {(customer.loans || []).length === 0 && <p className="text-sm text-slate-400">{t("common.noData")}</p>}
          </div>
        </div>
      )}

      {tab === "loans" && (
        <div className="space-y-2">
          {(customer.loans || []).map((loan) => (
            <LoanRow key={loan.id} loan={loan} onReminder={() => sendReminder(loan.id)} />
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div className="card divide-y divide-slate-100">
          <h3 className="font-bold text-navy p-4 pb-2">{t("customerDetails.paymentHistory")}</h3>
          {(customer.payments || []).map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-navy">{formatDate(p.paymentDate, settings?.dateFormat)}</div>
                <div className="text-xs text-slate-400 capitalize">{p.paymentMode}</div>
              </div>
              <div className="font-bold text-success">{formatCurrency(p.amount)}</div>
            </div>
          ))}
          {(customer.payments || []).length === 0 && (
            <p className="text-sm text-slate-400 p-4">{t("common.noData")}</p>
          )}
        </div>
      )}

      {showEdit && (
        <CustomerFormModal mode="edit" customer={customer} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}

function SummaryStat({ label, value, color = "text-navy" }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function LoanRow({ loan, onReminder }: { loan: Loan; onReminder: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/loans/${loan.id}`)}
      className="card p-3.5 hover:border-brand/40 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-navy text-sm">{loan.notes || t("loan.loanDetails")}</div>
          <div className="text-xs text-slate-400">{formatCurrency(loan.principalAmount)} · {t(`loan.${camel(loan.repaymentCycle)}`, loan.repaymentCycle)}</div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status="active" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/loans/${loan.id}/edit`);
            }}
            className="text-brand"
            title={t("customerDetails.edit")}
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReminder();
            }}
            className="text-teal"
            title={t("customerDetails.whatsapp")}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function camel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
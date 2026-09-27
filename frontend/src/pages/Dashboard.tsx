import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  TrendingUp, Wallet, AlertTriangle, Gift, Landmark, PiggyBank,
  UserPlus, FileText, CreditCard, Send, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { DashboardData } from "@/types";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatDate } from "@/utils/format";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

export function Dashboard() {
  const { t } = useTranslation();
  const { email } = useAuth();
  const { settings } = useSettings();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardData>("/dashboard")).data,
  });

  if (isLoading || !data) {
    return <div className="text-center text-slate-400 py-20">{t("common.loading")}</div>;
  }

  const quickActions = [
    { icon: UserPlus, label: t("dashboard.addCustomer"), to: "/customers?add=1", bg: "bg-blue-50 text-brand" },
    { icon: Landmark, label: t("dashboard.addLoan"), to: "/loans/new", bg: "bg-emerald-50 text-success" },
    { icon: CreditCard, label: t("dashboard.addPayment"), to: "/payments/new", bg: "bg-amber-50 text-warning" },
    { icon: Send, label: t("dashboard.sendReminder"), to: "/notifications", bg: "bg-teal/10 text-teal" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy">
          {t("dashboard.hello", { name: settings?.name || email?.split("@")[0] || "" })}
        </h1>
        <p className="text-sm text-slate-500">{t("dashboard.subtitle")} 👋</p>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<TrendingUp size={18} />} iconBg="bg-blue-50 text-brand" label={t("dashboard.totalPrincipal")} value={formatCurrency(data.summary.totalPrincipal)} />
        <StatCard icon={<Wallet size={18} />} iconBg="bg-emerald-50 text-success" label={t("dashboard.totalCollected")} value={formatCurrency(data.summary.totalCollected)} valueColor="text-success" />
        <StatCard icon={<AlertTriangle size={18} />} iconBg="bg-amber-50 text-warning" label={t("dashboard.outstanding")} value={formatCurrency(data.summary.totalOutstanding)} valueColor="text-warning" />
        <StatCard icon={<PiggyBank size={18} />} iconBg="bg-teal/10 text-teal" label={t("dashboard.totalInterest")} value={formatCurrency(data.summary.totalInterest)} />
        <StatCard icon={<AlertTriangle size={18} />} iconBg="bg-red-50 text-danger" label={t("dashboard.lateFees")} value={formatCurrency(data.summary.totalLateFees)} valueColor="text-danger" />
        <StatCard icon={<Gift size={18} />} iconBg="bg-slate-100 text-slate-500" label={t("dashboard.waivedFees")} value={formatCurrency(data.summary.totalWaivedFees)} />
      </div>

      {/* Today's collection */}
      <div className="card p-4">
        <h2 className="font-bold text-navy mb-3">{t("dashboard.todaysCollection")}</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-navy">{data.todayCollection.dueCustomers}</div>
            <div className="text-[11px] text-slate-500">{t("dashboard.dueToday")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-navy">{formatCurrency(data.todayCollection.totalDue)}</div>
            <div className="text-[11px] text-slate-500">{t("dashboard.totalDue")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-success">{formatCurrency(data.todayCollection.collected)}</div>
            <div className="text-[11px] text-slate-500">{t("dashboard.collected")}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-warning">{formatCurrency(data.todayCollection.pending)}</div>
            <div className="text-[11px] text-slate-500">{t("dashboard.pending")}</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-4">
        <h2 className="font-bold text-navy mb-3">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} to={a.to} className="flex flex-col items-center gap-1.5 text-center">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${a.bg}`}>
                <a.icon size={19} />
              </div>
              <span className="text-[11px] font-medium text-slate-600 leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Overdue */}
        <div className="card p-4">
          <h2 className="font-bold text-navy mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-danger" /> {t("dashboard.overdue")}
          </h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-danger">{data.overdue.overdueCustomers}</div>
              <div className="text-[11px] text-slate-500">{t("dashboard.overdueCustomers")}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-danger">{formatCurrency(data.overdue.overdueAmount)}</div>
              <div className="text-[11px] text-slate-500">{t("dashboard.overdueAmount")}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-danger">{formatCurrency(data.overdue.pendingFine)}</div>
              <div className="text-[11px] text-slate-500">{t("dashboard.pendingFine")}</div>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div className="card p-4">
          <h2 className="font-bold text-navy mb-3 flex items-center gap-2">
            <Clock size={16} className="text-brand" /> {t("dashboard.upcoming")}
          </h2>
          <div className="space-y-2.5 max-h-40 overflow-y-auto">
            {data.upcoming.length === 0 && <p className="text-xs text-slate-400">{t("common.noData")}</p>}
            {data.upcoming.map((u, i) => (
              <Link
                key={i}
                to={`/customers/${u.customerId}`}
                className="flex items-center justify-between text-sm hover:bg-slate-50 rounded-lg px-1 py-1"
              >
                <span className="font-medium text-navy">{u.customerName}</span>
                <span className="text-slate-400 text-xs">{formatDate(u.dueDate, settings?.dateFormat)}</span>
                <span className="font-semibold text-brand">{formatCurrency(u.amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

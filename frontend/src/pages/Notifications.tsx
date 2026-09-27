import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, AlertTriangle, Clock, Gift, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AppNotification } from "@/types";

const ICONS: Record<string, any> = {
  upcoming: Clock,
  due_today: Bell,
  overdue: AlertTriangle,
  fine_applied: AlertTriangle,
  payment_received: CheckCircle,
  fine_waived: Gift,
};

const COLORS: Record<string, string> = {
  upcoming: "bg-blue-50 text-brand",
  due_today: "bg-amber-50 text-warning",
  overdue: "bg-red-50 text-danger",
  fine_applied: "bg-red-50 text-danger",
  payment_received: "bg-emerald-50 text-success",
  fine_waived: "bg-slate-100 text-slate-500",
};

const FILTERS = ["all", "dueToday", "overdue", "upcoming"] as const;

export function Notifications() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get<AppNotification[]>("/notifications")).data,
  });

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "dueToday") return n.type === "due_today";
    if (filter === "overdue") return n.type === "overdue" || n.type === "fine_applied";
    if (filter === "upcoming") return n.type === "upcoming";
    return true;
  });

  function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">{t("notifications.title")}</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              filter === f ? "bg-navy text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {t(`notifications.${f}`)}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        {isLoading && <div className="p-6 text-center text-slate-400 text-sm">{t("common.loading")}</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-sm">{t("common.noData")}</div>
        )}
        {filtered.map((n) => {
          const Icon = ICONS[n.type] || Bell;
          return (
            <div key={n.id} className="p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${COLORS[n.type]}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm">{n.title}</div>
                <div className="text-xs text-slate-500">{n.message}</div>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

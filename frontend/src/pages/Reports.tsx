import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/utils/format";
import { useSettings } from "@/context/SettingsContext";

const TABS = ["daily", "monthly", "outstanding"] as const;

export function Reports() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [tab, setTab] = useState<(typeof TABS)[number]>("monthly");
  const [monthOffset, setMonthOffset] = useState(0);

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = target.getFullYear();
  const month = target.getMonth() + 1;
  const monthLabel = target.toLocaleString("en-US", { month: "long", year: "numeric" });

  const { data: monthly } = useQuery({
    queryKey: ["report-monthly", year, month],
    queryFn: async () => (await api.get("/reports/monthly", { params: { year, month } })).data,
    enabled: tab === "monthly",
  });

  const { data: outstanding = [] } = useQuery({
    queryKey: ["report-outstanding"],
    queryFn: async () => (await api.get("/reports/outstanding")).data,
    enabled: tab === "outstanding",
  });

  const { data: daily } = useQuery({
    queryKey: ["report-daily"],
    queryFn: async () => (await api.get("/reports/daily")).data,
    enabled: tab === "daily",
  });

  function exportCsv() {
    const rows: string[] = ["Date,Customer,Amount,Mode"];
    const payments = tab === "monthly" ? monthly?.payments : daily;
    (payments || []).forEach((p: any) => rows.push(`${p.paymentDate},${p.customerName || p.customerId},${p.amount},${p.paymentMode}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${tab}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-navy">{t("reports.title")}</h1>

      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100 w-fit">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === tabKey ? "bg-brand text-white" : "text-slate-500"}`}
          >
            {t(`reports.${tabKey}`)}
          </button>
        ))}
      </div>

      {tab === "monthly" && (
        <>
          <div className="card p-3 flex items-center justify-between">
            <button onClick={() => setMonthOffset((o) => o - 1)}><ChevronLeft size={18} className="text-slate-400" /></button>
            <span className="font-semibold text-navy">{monthLabel}</span>
            <button onClick={() => setMonthOffset((o) => o + 1)}><ChevronRight size={18} className="text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-xs text-slate-500">{t("reports.totalCollected")}</div>
              <div className="text-xl font-bold text-success mt-1">{formatCurrency(monthly?.totalCollected || 0)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500">Transactions</div>
              <div className="text-xl font-bold text-navy mt-1">{monthly?.count || 0}</div>
            </div>
          </div>
          <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> {t("reports.exportReport")}
          </button>
          <div className="card p-4">
            <h3 className="font-bold text-navy mb-3">{t("reports.recentTransactions")}</h3>
            <div className="space-y-2">
              {(monthly?.payments || []).slice(0, 15).map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm border-b border-slate-50 pb-2 last:border-0">
                  <span className="text-slate-500">{formatDate(p.paymentDate, settings?.dateFormat)}</span>
                  <span className="font-semibold text-success">{formatCurrency(p.amount)}</span>
                </div>
              ))}
              {(monthly?.payments || []).length === 0 && <p className="text-sm text-slate-400">{t("common.noData")}</p>}
            </div>
          </div>
        </>
      )}

      {tab === "daily" && (
        <>
          <button onClick={exportCsv} className="btn-secondary flex items-center gap-2 text-sm">
            <Download size={15} /> {t("reports.exportReport")}
          </button>
          <div className="card divide-y divide-slate-100">
            {(daily || []).map((p: any) => (
              <div key={p.id} className="p-4 flex justify-between text-sm">
                <span className="font-medium text-navy">{p.customerName}</span>
                <span className="font-semibold text-success">{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {(daily || []).length === 0 && <p className="text-sm text-slate-400 p-4">{t("common.noData")}</p>}
          </div>
        </>
      )}

      {tab === "outstanding" && (
        <div className="card divide-y divide-slate-100">
          {outstanding.map((row: any) => (
            <div key={row.customerId} className="p-4 flex justify-between text-sm">
              <span className="font-medium text-navy">{row.customerName}</span>
              <span className="font-semibold text-warning">{formatCurrency(row.outstanding)}</span>
            </div>
          ))}
          {outstanding.length === 0 && <p className="text-sm text-slate-400 p-4">{t("common.noData")}</p>}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Phone, MessageCircle, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Customer } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/utils/format";
import { CustomerFormModal } from "@/components/customers/CustomerFormModal";

const FILTERS = ["all", "active", "dueToday", "upcoming", "overdue", "paid", "partiallyPaid"] as const;

function customerStatus(c: Customer): string {
  if (!c.summary) return "active";
  if (c.summary.totalOutstanding <= 0 && (c.summary.totalPaid ?? 0) > 0) return "paid";
  return "active";
}

export function Customers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [showAdd, setShowAdd] = useState(searchParams.get("add") === "1");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => (await api.get<Customer[]>("/customers", { params: { search } })).data,
  });

  const filtered = customers.filter((c) => {
    if (filter === "all") return true;
    if (filter === "active") return true;
    return true; // status-specific filtering can be extended with real due-date data per customer
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{t("customers.title")}</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary hidden md:flex items-center gap-1.5 text-sm">
          <Plus size={16} /> {t("customers.addCustomer")}
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("customers.search")}
          className="input-field pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold ${
              filter === f ? "bg-navy text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {t(`customers.${f}`)}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-slate-100">
        {isLoading && <div className="p-6 text-center text-slate-400 text-sm">{t("common.loading")}</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="p-6 text-center text-slate-400 text-sm">{t("customers.noResults")}</div>
        )}
        {filtered.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-50 text-brand flex items-center justify-center font-bold shrink-0">
              {c.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy truncate">{c.name}</span>
                <StatusBadge status={customerStatus(c)} />
              </div>
              <div className="text-xs text-slate-400">{c.customerCode} · {c.phone}</div>
              {c.summary && (
                <div className="text-xs mt-0.5">
                  <span className="text-slate-500">{t("customers.name") === "" ? "" : ""}</span>
                  <span className="font-semibold text-warning">{formatCurrency(c.summary.totalOutstanding)}</span>
                  <span className="text-slate-400"> outstanding</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a href={`tel:${c.phone}`} className="w-8 h-8 rounded-full bg-blue-50 text-brand flex items-center justify-center">
                <Phone size={14} />
              </a>
              <a
                href={`https://wa.me/${c.phone.replace(/[^\d]/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-50 text-success flex items-center justify-center"
              >
                <MessageCircle size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-popover"
      >
        <Plus size={22} />
      </button>

      {showAdd && (
        <CustomerFormModal
          mode="add"
          onClose={() => {
            setShowAdd(false);
            setSearchParams({});
          }}
        />
      )}
    </div>
  );
}
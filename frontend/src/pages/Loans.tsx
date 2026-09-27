import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Loan } from "@/types";
import { formatCurrency } from "@/utils/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function Loans() {
  const { t } = useTranslation();
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans-all"],
    queryFn: async () => (await api.get<Loan[]>("/loans")).data,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-lite"],
    queryFn: async () => (await api.get<Customer[]>("/customers")).data,
  });

  function customerName(id: string) {
    return customers.find((c) => c.id === id)?.name || "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">{t("nav.loans")}</h1>
        <Link to="/loans/new" className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> {t("loan.addLoan")}
        </Link>
      </div>

      <div className="card divide-y divide-slate-100">
        {isLoading && <div className="p-6 text-center text-slate-400 text-sm">{t("common.loading")}</div>}
        {!isLoading && loans.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">{t("common.noData")}</div>}
        {loans.map((loan) => (
          <Link key={loan.id} to={`/loans/${loan.id}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
            <div>
              <div className="font-semibold text-navy text-sm">{customerName(loan.customerId)}</div>
              <div className="text-xs text-slate-400">{loan.notes || "Loan"} · {formatCurrency(loan.principalAmount)}</div>
            </div>
            <StatusBadge status="active" />
          </Link>
        ))}
      </div>
    </div>
  );
}

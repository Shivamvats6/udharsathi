import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Customer, Loan } from "@/types";
import { formatCurrency } from "@/utils/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteActions } from "@/hooks/useDeleteActions";

export function Loans() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deleteLoan } = useDeleteActions();
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDelete() {
    if (!loanToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLoan(loanToDelete.id);
      setLoanToDelete(null);
    } catch (e: any) {
      setDeleteError(e?.response?.data?.error || t("common.error"));
    } finally {
      setDeleting(false);
    }
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
          <div
            key={loan.id}
            onClick={() => navigate(`/loans/${loan.id}`)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
          >
            <div>
              <div className="font-semibold text-navy text-sm">{customerName(loan.customerId)}</div>
              <div className="text-xs text-slate-400">{loan.notes || "Loan"} · {formatCurrency(loan.principalAmount)}</div>
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
                  setDeleteError(null);
                  setLoanToDelete(loan);
                }}
                className="text-danger"
                title={t("common.delete")}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!loanToDelete}
        title={t("loan.deleteLoanTitle")}
        message={t("loan.deleteLoanMsg", {
          amount: formatCurrency(loanToDelete?.principalAmount || 0),
          name: loanToDelete ? customerName(loanToDelete.customerId) : "",
        })}
        confirmLabel={t("loan.deleteLoan")}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setLoanToDelete(null)}
      />
    </div>
  );
}
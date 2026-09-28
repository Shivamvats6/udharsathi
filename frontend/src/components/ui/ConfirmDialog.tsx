import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-5">
        <h2 className="font-bold text-navy mb-2">{title}</h2>
        <p className="text-sm text-slate-500 mb-3">{message}</p>
        {error && (
          <div className="text-sm text-danger bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</div>
        )}
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={loading} className="btn-secondary flex-1">
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 text-white font-semibold rounded-xl px-4 py-2.5 disabled:opacity-60"
          >
            {loading ? t("common.loading") : confirmLabel || t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
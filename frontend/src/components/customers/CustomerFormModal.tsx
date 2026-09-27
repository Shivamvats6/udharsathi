import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { Customer } from "@/types";

interface CustomerFormModalProps {
  mode: "add" | "edit";
  customer?: Customer; // required when mode === "edit"
  onClose: () => void;
  onSaved?: (customer: Customer) => void;
}

/** Extracts just the 10-digit local number, stripping any +91 / 91 / 0 country prefix. */
function toLocalDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function CustomerFormModal({ mode, customer, onClose, onSaved }: CustomerFormModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [name, setName] = useState(customer?.name || "");
  const [phoneDigits, setPhoneDigits] = useState(toLocalDigits(customer?.phone || ""));
  const [address, setAddress] = useState(customer?.address || "");
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "hi">(customer?.preferredLanguage || "en");
  const [notes, setNotes] = useState(customer?.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhoneChange(raw: string) {
    // keep digits only, cap at 10 - the "+91" prefix is shown separately and added automatically on save
    setPhoneDigits(raw.replace(/\D/g, "").slice(0, 10));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const payload = { name, phone: `+91${phoneDigits}`, address, preferredLanguage, notes };
    try {
      let saved: Customer;
      if (mode === "edit" && customer) {
        saved = (await api.put<Customer>(`/customers/${customer.id}`, payload)).data;
        await queryClient.invalidateQueries({ queryKey: ["customer", customer.id] });
      } else {
        saved = (await api.post<Customer>("/customers", payload)).data;
      }
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSaved?.(saved);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length >= 2 && phoneDigits.length === 10;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-navy">
            {mode === "edit" ? t("customerDetails.edit") : t("customers.addCustomer")}
          </h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label-field">{t("customers.name")}</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="label-field">{t("customers.phone")}</label>
            <div className="flex items-center gap-2">
              <span className="input-field w-16 shrink-0 text-center bg-slate-50 text-slate-500 select-none">+91</span>
              <input
                className="input-field flex-1"
                value={phoneDigits}
                onChange={(e) => handlePhoneChange(e.target.value)}
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
              />
            </div>
            {phoneDigits.length > 0 && phoneDigits.length < 10 && (
              <p className="text-[11px] text-warning mt-1">10 digit mobile number daaliye</p>
            )}
          </div>

          <div>
            <label className="label-field">{t("customers.address")}</label>
            <input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="label-field">{t("customers.preferredLanguage")}</label>
            <select
              className="input-field"
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value as "en" | "hi")}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
          <div>
            <label className="label-field">{t("customers.notes")}</label>
            <textarea className="input-field" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <div className="text-xs text-danger bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <button onClick={handleSave} disabled={saving || !canSave} className="btn-primary w-full mt-2">
            {saving ? t("common.loading") : mode === "edit" ? t("common.save") : t("customers.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
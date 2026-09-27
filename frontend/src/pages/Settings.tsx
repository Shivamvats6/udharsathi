import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, LogOut } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { setAppLanguage } from "@/i18n";

export function Settings() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { logout } = useAuth();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  useEffect(() => setForm(settings), [settings]);

  if (!form) return <div className="text-center text-slate-400 py-20">{t("common.loading")}</div>;

  function set<K extends keyof NonNullable<typeof form>>(key: K, value: any) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function setNotif(key: keyof NonNullable<typeof form>["notifications"], value: boolean) {
    setForm((f) => (f ? { ...f, notifications: { ...f.notifications, [key]: value } } : f));
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      await updateSettings(form);
    } finally {
      setSaving(false);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    setBackupMsg(null);
    try {
      const res = await api.post("/backup/now");
      setBackupMsg(`Backed up as ${res.data.fileName}`);
    } catch (e: any) {
      setBackupMsg(e?.response?.data?.error || "Backup requires Google Drive to be configured (see SETUP.md)");
    } finally {
      setBackingUp(false);
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-xl font-bold text-navy">{t("settings.title")}</h1>

      <Section title={t("settings.financerProfile")}>
        <Field label={t("settings.name")} value={form.name} onChange={(v) => set("name", v)} />
        <Field label={t("settings.businessName")} value={form.businessName} onChange={(v) => set("businessName", v)} />
        <Field label={t("settings.mobile")} value={form.mobile} onChange={(v) => set("mobile", v)} />
        <Field label={t("settings.whatsappNumber")} value={form.whatsappNumber} onChange={(v) => set("whatsappNumber", v)} />
        <Field label={t("settings.email")} value={form.email} onChange={(v) => set("email", v)} />
        <Field label={t("settings.address")} value={form.address} onChange={(v) => set("address", v)} />
      </Section>

      <Section title={t("settings.languagePreferences")}>
        <div>
          <label className="label-field">{t("settings.appLanguage")}</label>
          <select
            className="input-field"
            value={form.language}
            onChange={(e) => {
              set("language", e.target.value);
              setAppLanguage(e.target.value as "en" | "hi");
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </div>
        <Field label={t("settings.currency")} value={form.currency} onChange={(v) => set("currency", v)} />
        <Field label={t("settings.dateFormat")} value={form.dateFormat} onChange={(v) => set("dateFormat", v)} />
      </Section>

      <Section title={t("settings.whatsappSettings")}>
        <div>
          <label className="label-field">{t("settings.hindiDefaultMessage")}</label>
          <textarea className="input-field" rows={4} value={form.whatsappDefaultMessageHi} onChange={(e) => set("whatsappDefaultMessageHi", e.target.value)} />
        </div>
        <div>
          <label className="label-field">{t("settings.englishDefaultMessage")}</label>
          <textarea className="input-field" rows={4} value={form.whatsappDefaultMessageEn} onChange={(e) => set("whatsappDefaultMessageEn", e.target.value)} />
        </div>
        <p className="text-[11px] text-slate-400">
          Variables: {"{customer_name} {amount_due} {next_payment_date} {outstanding} {late_fee} {total_due} {business_name}"}
        </p>
      </Section>

      <Section title={t("settings.notificationsSection")}>
        <Toggle label={t("settings.pushNotifications")} checked={form.notifications.push} onChange={(v) => setNotif("push", v)} />
        <Toggle label={t("settings.dueDateReminders")} checked={form.notifications.dueDateReminders} onChange={(v) => setNotif("dueDateReminders", v)} />
        <Toggle label={t("settings.overdueAlerts")} checked={form.notifications.overdueAlerts} onChange={(v) => setNotif("overdueAlerts", v)} />
        <Toggle label={t("settings.weeklySummary")} checked={form.notifications.weeklySummary} onChange={(v) => setNotif("weeklySummary", v)} />
      </Section>

      <Section title={t("settings.dataBackup")}>
        <button onClick={handleBackup} disabled={backingUp} className="w-full flex items-center justify-between text-sm font-medium text-navy py-1">
          {backingUp ? t("common.loading") : t("settings.backupToGoogleDrive")}
          <ChevronRight size={16} className="text-slate-400" />
        </button>
        {backupMsg && <p className="text-xs text-slate-500">{backupMsg}</p>}
      </Section>

      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving ? t("common.loading") : t("settings.save")}
      </button>

      <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-danger font-semibold py-2.5">
        <LogOut size={16} /> {t("settings.logout")}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-navy">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label-field">{label}</label>
      <input className="input-field" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-navy">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? "bg-success" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? "left-4.5" : "left-0.5"}`} style={{ left: checked ? "18px" : "2px" }} />
      </button>
    </div>
  );
}

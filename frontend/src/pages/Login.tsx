import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrendingUp, Globe } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setAppLanguage } from "@/i18n";

export function Login() {
  const { t, i18n } = useTranslation();
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("shivam@finance.com");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      /* error shown via context */
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 relative">
      <button
        onClick={() => setAppLanguage(i18n.language === "en" ? "hi" : "en")}
        className="absolute top-5 right-5 flex items-center gap-1.5 text-white/80 text-xs font-semibold bg-white/10 rounded-full px-3 py-1.5"
      >
        <Globe size={14} /> {i18n.language === "en" ? "हिंदी" : "English"}
      </button>

      <div className="w-16 h-16 rounded-2xl bg-teal flex items-center justify-center mb-4">
        <TrendingUp size={32} className="text-white" />
      </div>
      <h1 className="text-white text-2xl font-extrabold">{t("app.name")}</h1>
      <p className="text-slate-300 text-sm mt-1 mb-8">{t("app.tagline")}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-popover">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-2.5 text-sm font-semibold text-navy mb-4 hover:bg-slate-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0012 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.05H2.18a11 11 0 000 9.9l3.66-2.85z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 00-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
          </svg>
          {t("login.google")}
        </button>
        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs text-slate-400">{t("login.or")}</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <label className="label-field">{t("login.email")}</label>
        <input className="input-field mb-3" value={email} onChange={(e) => setEmail(e.target.value)} type="text" />

        <label className="label-field">{t("login.password")}</label>
        <input
          className="input-field mb-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="finwise123"
        />
        <div className="text-right mb-4">
          <button type="button" className="text-xs text-brand font-medium">
            {t("login.forgot")}
          </button>
        </div>

        {error && <div className="text-xs text-danger bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t("common.loading") : t("login.submit")}
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-4">
          Demo: shivam@finance.com / finwise123
        </p>
      </form>
    </div>
  );
}

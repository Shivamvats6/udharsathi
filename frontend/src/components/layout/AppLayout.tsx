import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, Landmark, Wallet, BarChart3, Settings as SettingsIcon,
  Bell, Globe, TrendingUp, MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { setAppLanguage } from "@/i18n";
import { useSettings } from "@/context/SettingsContext";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.home" },
  { to: "/customers", icon: Users, key: "nav.customers" },
  { to: "/loans", icon: Landmark, key: "nav.loans" },
  { to: "/reports", icon: BarChart3, key: "nav.reports" },
];

const moreItems = [
  { to: "/payments", icon: Wallet, key: "nav.payments" },
  { to: "/notifications", icon: Bell, key: "nav.notifications" },
  { to: "/settings", icon: SettingsIcon, key: "nav.settings" },
];

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { settings } = useSettings();
  const [showMore, setShowMore] = useState(false);

  function toggleLang() {
    setAppLanguage(i18n.language === "en" ? "hi" : "en");
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-navy text-white shrink-0">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">FinWise</div>
            <div className="text-[10px] text-slate-300 leading-tight">{t("app.tagline")}</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-2">
          {[...navItems, ...moreItems].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="p-4">
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 text-white text-sm font-semibold py-2.5 hover:bg-white/15"
          >
            <Globe size={16} />
            {i18n.language === "en" ? "हिंदी" : "English"}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile + desktop) */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-bold text-navy">FinWise</span>
          </div>
          <div className="hidden md:block text-sm text-slate-500">
            {settings?.businessName || ""}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="md:hidden flex items-center gap-1 text-xs font-semibold text-brand">
              <Globe size={14} />
              {i18n.language === "en" ? "हिं" : "EN"}
            </button>
            <NavLink to="/notifications" className="relative">
              <Bell size={20} className="text-slate-500" />
            </NavLink>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-5 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-100 grid grid-cols-5 px-1 py-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium ${
                isActive ? "text-brand" : "text-slate-400"
              }`
            }
          >
            <item.icon size={20} />
            {t(item.key)}
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore((s) => !s)}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium text-slate-400"
        >
          <MoreHorizontal size={20} />
          {t("nav.more")}
        </button>
      </nav>

      {showMore && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-16 right-3 bg-white rounded-2xl shadow-popover p-2 w-48"
            onClick={(e) => e.stopPropagation()}
          >
            {moreItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMore(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy hover:bg-slate-50"
              >
                <item.icon size={18} />
                {t(item.key)}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

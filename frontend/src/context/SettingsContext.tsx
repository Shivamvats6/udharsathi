import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";
import { FinancerSettings } from "@/types";
import { useAuth } from "./AuthContext";
import { setAppLanguage } from "@/i18n";

interface SettingsContextValue {
  settings: FinancerSettings | null;
  refresh: () => Promise<void>;
  updateSettings: (data: Partial<FinancerSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<FinancerSettings | null>(null);

  async function refresh() {
    const res = await api.get("/settings");
    setSettings(res.data);
    if (res.data.language) setAppLanguage(res.data.language);
  }

  async function updateSettings(data: Partial<FinancerSettings>) {
    const res = await api.put("/settings", data);
    setSettings(res.data);
    if (data.language) setAppLanguage(data.language);
  }

  useEffect(() => {
    if (isAuthenticated) refresh().catch(() => {});
  }, [isAuthenticated]);

  return <SettingsContext.Provider value={{ settings, refresh, updateSettings }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

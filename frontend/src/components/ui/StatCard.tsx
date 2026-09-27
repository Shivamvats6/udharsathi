import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

export function StatCard({ icon, iconBg, label, value, valueColor = "text-navy" }: StatCardProps) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-slate-500 font-medium truncate">{label}</div>
        <div className={`text-lg font-bold mt-0.5 ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}

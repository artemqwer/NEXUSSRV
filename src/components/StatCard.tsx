"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  extra?: React.ReactNode;
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = "#00e5ff", extra }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-400 leading-tight">{title}</span>
        <Icon size={16} color={iconColor} className="opacity-70 mt-0.5 shrink-0" />
      </div>
      <div className="text-2xl font-bold text-white leading-tight">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      {extra}
    </div>
  );
}

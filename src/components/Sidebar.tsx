"use client";

import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, HardDrive, Globe, Terminal,
  Users, Settings, Server, Activity, ScrollText,
} from "lucide-react";

const navItems: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",   label: "Дашборд",        icon: LayoutDashboard },
  { id: "monitoring",  label: "Моніторинг",      icon: Activity },
  { id: "logs",        label: "Логи",            icon: ScrollText },
  { id: "storage",     label: "Сховище",         icon: HardDrive },
  { id: "network",     label: "Мережа",           icon: Globe },
  { id: "terminal",    label: "Термінал",         icon: Terminal },
  { id: "users",       label: "Користувачі",      icon: Users },
];

interface SidebarProps {
  active: string;
  setActive: (id: string) => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

export function Sidebar({ active, setActive, isOpen, setOpen }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)", minWidth: "14rem", maxWidth: "14rem" }}
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col py-5 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 mb-8">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--cyan-dim)", border: "1px solid rgba(0,229,255,0.2)" }}>
            <Server size={14} color="var(--cyan)" />
          </div>
          <span className="font-bold text-sm tracking-widest text-white">
            NEXUS<span style={{ color: "var(--cyan)" }}>SRV</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => { setActive(id); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive ? "var(--cyan-dim)" : "transparent",
                  color: isActive ? "var(--cyan)" : "#6b7280",
                  border: isActive ? "1px solid rgba(0,229,255,0.15)" : "1px solid transparent",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
              >
                <Icon size={16} className="shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 mt-4 shrink-0">
          <button
            onClick={() => { setActive("settings"); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
            style={{
              background: active === "settings" ? "var(--cyan-dim)" : "transparent",
              color: active === "settings" ? "var(--cyan)" : "#6b7280",
              border: active === "settings" ? "1px solid rgba(0,229,255,0.15)" : "1px solid transparent",
            }}
            onMouseEnter={e => { if (active !== "settings") (e.currentTarget as HTMLElement).style.color = "#e2e8f0"; }}
            onMouseLeave={e => { if (active !== "settings") (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
          >
            <Settings size={16} className="shrink-0" />
            Налаштування
          </button>
        </div>
      </aside>
    </>
  );
}

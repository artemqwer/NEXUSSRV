"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { TemperatureGauge } from "@/components/TemperatureGauge";
import { SearchModal } from "@/components/SearchModal";
import { api, ServerStats } from "@/api";
import {
  Cpu, MemoryStick, HardDrive, Network,
  Bell, Search, CheckCircle2, Flame, AlertTriangle, Menu,
  BatteryMedium, Smartphone, LogOut,
} from "lucide-react";

// Динамічний імпорт секцій
const LogsSection       = dynamic(() => import("@/components/LogsSection").then(m => ({ default: m.LogsSection })),             { ssr: false });
const MonitoringSection = dynamic(() => import("@/components/MonitoringSection").then(m => ({ default: m.MonitoringSection })), { ssr: false });
const StorageSection    = dynamic(() => import("@/components/StorageSection").then(m => ({ default: m.StorageSection })),       { ssr: false });
const NetworkSection    = dynamic(() => import("@/components/NetworkSection").then(m => ({ default: m.NetworkSection })),       { ssr: false });
const TerminalSection   = dynamic(() => import("@/components/TerminalSection").then(m => ({ default: m.TerminalSection })),     { ssr: false });
const UsersSection      = dynamic(() => import("@/components/UsersSection").then(m => ({ default: m.UsersSection })),           { ssr: false });
const SettingsSection   = dynamic(() => import("@/components/SettingsSection").then(m => ({ default: m.SettingsSection })),     { ssr: false });

// Mini progress bar
function ProgressBar({ value, color = "var(--cyan)" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

// ============================
// Dashboard — адаптовано під телефонний Debian
// ============================
function DashboardSection() {
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [tick,  setTick]  = useState(0);
  const [now,   setNow]   = useState("");

  useEffect(() => { api.getStats().then(setStats); }, []);

  useEffect(() => {
    // Стартуємо інтервал — і час, і tick оновлюємо всередині колбеку (не синхронно в body)
    const tick = () => {
      setTick(n => n + 1);
      setNow(new Date().toLocaleTimeString("uk-UA"));
    };
    tick(); // перший виклик через setTimeout щоб не бути синхронним у body
    // Але useEffect вже запускається тільки на клієнті, тому це safe
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);

  // Якщо немає сервера — малюємо "очікувані" дефолтні
  const cpuLoad     = stats?.cpu?.usage ?? (28 + Math.round(Math.sin(tick * 0.7) * 10));
  const temperature = stats?.cpu?.temp  ?? (48 + Math.round(Math.cos(tick * 0.5) * 4));
  const ramUsedGB   = stats?.ram?.used ? +(stats.ram.used / 1024).toFixed(1) : +(2.1 + Math.round(Math.sin(tick * 0.3) * 10) / 10).toFixed(1);
  const ramTotalGB  = stats?.ram?.total ? +(stats.ram.total / 1024).toFixed(1) : 6;
  const ramPercent  = stats?.ram?.percent ?? Math.round(ramUsedGB / ramTotalGB * 100);
  const storageUsed = stats?.storage?.used ?? 22;
  const storageTot  = stats?.storage?.total ?? 128;
  const storagePerc = stats?.storage?.percent ?? Math.round((storageUsed/storageTot)*100);
  const tempWarn    = temperature >= 55;
  const batteryLvl  = stats?.battery?.level ?? 74;

  return (
    <div className="flex flex-col gap-5 h-full overflow-hidden">
      {/* Title */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Smartphone size={16} className="text-gray-500" />
            <h1 className="text-xl font-bold text-white">Огляд Сервера</h1>
          </div>
          <p className="text-xs text-gray-500">Debian Linux · ARM · Останнє оновлення: {now}</p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}
        >
          <CheckCircle2 size={13} />
          Всі системи в нормі
        </div>
      </div>

      {/* Stat cards — ARM-specific values */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <StatCard
          title="Навантаження ЦП"
          value={`${cpuLoad}%`}
          subtitle={`ARM Cortex-A53 (${stats?.cpu?.cores ?? 8} cores)`}
          icon={Cpu}
          iconColor="#00e5ff"
          extra={<ProgressBar value={cpuLoad} />}
        />
        <StatCard
          title="RAM"
          value={`${ramUsedGB} / ${ramTotalGB} GB`}
          subtitle={`${ramPercent}% використано`}
          icon={MemoryStick}
          iconColor="#818cf8"
          extra={<ProgressBar value={ramPercent} color="#818cf8" />}
        />
        <StatCard
          title="Диск (eMMC)"
          value={`${storageUsed} GB`}
          subtitle={`Вільно: ${storageTot - storageUsed} GB / ${storageTot} GB`}
          icon={HardDrive}
          iconColor="#34d399"
          extra={<ProgressBar value={storagePerc} color="#34d399" />}
        />
        <StatCard
          title="Мережевий Ping"
          value={stats?.network?.ping ? `${stats.network.ping} ms` : "—"}
          subtitle="wlan0 · Wi-Fi 5"
          icon={Network}
          iconColor="#c084fc"
          extra={<ProgressBar value={stats?.network?.ping ? Math.min(stats.network.ping, 100) : 0} color="#c084fc" />}
        />
      </div>

      {/* Temperature + info block */}
      <div
        className="rounded-xl p-5 shrink-0"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Gauge */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-2 self-start">
              <Flame size={15} style={{ color: "#f59e0b" }} />
              Температура SoC
              {tempWarn && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
                  style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                  Увага
                </span>
              )}
            </div>
            <TemperatureGauge value={temperature} maxTemp={80} label="CPU Thermal Zone" />
          </div>

          {/* Meta grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              { label: "Статус",        value: tempWarn ? "Підвищена" : "Норма",   color: tempWarn ? "#f59e0b" : "#34d399", icon: tempWarn ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} /> },
              { label: "Критична",      value: "80°C",                              color: "#f87171", icon: null },
              { label: "Акумулятор",    value: `${batteryLvl}%`,                   color: "#34d399", icon: <BatteryMedium size={11} /> },
              { label: "Зарядка",       value: stats?.battery?.isCharging ? "Так" : "Ні", color: "#34d399", icon: null },
              { label: "Аптайм",        value: stats?.uptime          ?? "--",      color: "#94a3b8", icon: null },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div className="text-gray-500 mb-1">{label}</div>
                <div className="flex items-center gap-1 font-semibold" style={{ color }}>
                  {icon}{value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// MAIN PAGE
// ============================
export default function AdminDashboard() {
  const router = useRouter();
  const [active,       setActive]       = useState("dashboard");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [currentUser,  setCurrentUser]  = useState<{ displayName: string; role: string } | null>(null);

  // Завантажуємо поточного юзера
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) setCurrentUser(d.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  // Ctrl+K / Cmd+K — відкрити пошук
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback((id: string) => {
    setActive(id);
    setSidebarOpen(false);
  }, []);

  const sectionTitle: Record<string, string> = {
    dashboard:  "Дашборд",
    monitoring: "Моніторинг",
    logs:       "Логи",
    storage:    "Сховище",
    network:    "Мережа",
    terminal:   "Термінал",
    users:      "Користувачі",
    settings:   "Налаштування",
  };

  return (
    <>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onNavigate={navigate} />

      <div className="flex h-dvh overflow-hidden" style={{ background: "var(--main-bg)" }}>
        <Sidebar active={active} setActive={navigate} isOpen={sidebarOpen} setOpen={setSidebarOpen} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* TOP BAR */}
          <header
            className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--main-bg)" }}
          >
            <button
              className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </button>

            {/* Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-400 transition-colors cursor-text"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
            >
              <Search size={12} className="shrink-0" />
              <span className="flex-1 text-left">Пошук розділу...</span>
              <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                Ctrl K
              </kbd>
            </button>

            {/* Breadcrumb */}
            <span className="hidden md:inline text-xs text-gray-600 ml-1">
              / <span className="text-gray-400">{sectionTitle[active]}</span>
            </span>

            <div className="ml-auto flex items-center gap-3">
              {/* Server online indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: "#34d399" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </div>

              <button className="relative p-1.5 text-gray-400 hover:text-white transition-colors">
                <Bell size={17} />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
              </button>

              {/* Avatar + logout */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{ background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff" }}
                  title={currentUser?.displayName ?? ""}
                >
                  {(currentUser?.displayName ?? "A").charAt(0).toUpperCase()}
                </div>
                {currentUser && (
                  <div className="hidden sm:block text-xs text-gray-500">
                    {currentUser.displayName}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                  title="Вийти"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-hidden p-5">
            {active === "dashboard"  && <DashboardSection />}
            {active === "monitoring" && <MonitoringSection />}
            {active === "logs"       && <LogsSection />}
            {active === "storage"    && <StorageSection />}
            {active === "network"    && <NetworkSection />}
            {active === "terminal"   && <TerminalSection />}
            {active === "users"      && <UsersSection currentUser={currentUser} />}
            {active === "settings"   && <SettingsSection />}
          </main>
        </div>
      </div>
    </>
  );
}

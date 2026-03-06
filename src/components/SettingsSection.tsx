"use client";

import { useState } from "react";
import { Save, RefreshCw, AlertTriangle, Link2 } from "lucide-react";

export function SettingsSection() {
  const [apiUrl,      setApiUrl]      = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api");
  const [useMock,     setUseMock]     = useState(true);
  const [pollSec,     setPollSec]     = useState("5");
  const [serverName,  setServerName]  = useState("Galaxy #3459");
  const [maxPlayers,  setMaxPlayers]  = useState("500");
  const [saved,       setSaved]       = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-white">Налаштування</h1>
        <p className="text-xs text-gray-500 mt-0.5">Конфігурація панелі та підключення до сервера</p>
      </div>

      {/* API Connection */}
      <section className="rounded-xl p-5 flex flex-col gap-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Link2 size={15} style={{ color: "var(--cyan)" }} />
          Підключення до бекенду
        </div>

        {/* Mock toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
          <div>
            <div className="text-sm text-gray-300 font-medium">Тестовий режим (Mock)</div>
            <div className="text-xs text-gray-500 mt-0.5">Панель показує фейкові дані. Вимкни щоб підключити реальний сервер</div>
          </div>
          <button
            onClick={() => setUseMock(v => !v)}
            className="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
            style={{ background: useMock ? "var(--cyan)" : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300"
              style={{ transform: useMock ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>

        {/* API URL */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">URL бекенду</label>
          <input
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
            disabled={useMock}
            className="w-full px-3 py-2.5 rounded-lg text-sm font-mono text-gray-300 outline-none transition-all"
            style={{
              background: useMock ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${useMock ? "rgba(255,255,255,0.05)" : "rgba(0,229,255,0.3)"}`,
              color: useMock ? "#4b5563" : "#e2e8f0",
            }}
            placeholder="http://192.168.0.x:8080/api"
          />
          <p className="text-[11px] text-gray-600">Введи IP-адресу сервера твого друга. Наприклад: <span className="font-mono text-gray-500">http://192.168.0.103:8080/api</span></p>
        </div>

        {/* Poll interval */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Інтервал оновлення (сек)</label>
          <input
            value={pollSec}
            onChange={e => setPollSec(e.target.value)}
            type="number"
            min="1"
            max="60"
            className="w-32 px-3 py-2.5 rounded-lg text-sm font-mono text-gray-300 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
          />
        </div>

        {!useMock && (
          <div className="flex items-start gap-2 p-3 rounded-lg text-xs" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <AlertTriangle size={13} className="text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-yellow-200">
              Переконайся що бекенд твого друга запущений і відкритий по CORS для домену Vercel.
              Якщо бекенд на тому ж телефоні-сервері — вкажи його локальний IP.
            </div>
          </div>
        )}
      </section>

      {/* Server info */}
      <section className="rounded-xl p-5 flex flex-col gap-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold text-white">Інформація про сервер</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Назва сервера</label>
            <input
              value={serverName}
              onChange={e => setServerName(e.target.value)}
              className="px-3 py-2.5 rounded-lg text-sm text-gray-300 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Макс. гравців</label>
            <input
              value={maxPlayers}
              onChange={e => setMaxPlayers(e.target.value)}
              type="number"
              className="px-3 py-2.5 rounded-lg text-sm text-gray-300 outline-none font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
            />
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl p-5 flex flex-col gap-3 shrink-0" style={{ background: "rgba(248,113,113,0.04)", border: "1px solid rgba(248,113,113,0.15)" }}>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#f87171" }}>
          <AlertTriangle size={15} />
          Небезпечна зона
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-all" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>
            <RefreshCw size={12} />
            Перезапустити сервер
          </button>
          <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-all text-gray-500" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            Скинути налаштування
          </button>
        </div>
      </section>

      {/* Save */}
      <div className="shrink-0">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: saved ? "rgba(52,211,153,0.15)" : "var(--cyan-dim)",
            color: saved ? "#34d399" : "var(--cyan)",
            border: `1px solid ${saved ? "rgba(52,211,153,0.3)" : "rgba(0,229,255,0.25)"}`,
          }}
        >
          <Save size={14} />
          {saved ? "✓ Збережено!" : "Зберегти"}
        </button>
      </div>
    </div>
  );
}

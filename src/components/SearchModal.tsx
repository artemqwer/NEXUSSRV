"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, LayoutDashboard, Activity, ScrollText, HardDrive, Globe, Terminal, Users, Settings } from "lucide-react";

interface SearchItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  keywords: string[];
}

const ITEMS: SearchItem[] = [
  { id: "dashboard",  label: "Дашборд",         desc: "Огляд сервера, температура, статистика",     icon: <LayoutDashboard size={14} />, keywords: ["dashboard","огляд","статистика","cpu","ram","температура"] },
  { id: "monitoring", label: "Моніторинг",       desc: "Графіки CPU, RAM, мережа в реальному часі",  icon: <Activity       size={14} />, keywords: ["моніторинг","графік","cpu","ram","мережа","live"] },
  { id: "logs",       label: "Логи",             desc: "Системні логи / живий вивід",                icon: <ScrollText     size={14} />, keywords: ["logs","логи","журнал","info","warn","error"] },
  { id: "storage",    label: "Сховище",          desc: "Диски, розділи, використання пам'яті",       icon: <HardDrive      size={14} />, keywords: ["сховище","диск","розділ","storage","disk"] },
  { id: "network",    label: "Мережа",           desc: "Інтерфейси, трафік, ping",                   icon: <Globe          size={14} />, keywords: ["мережа","network","eth","ping","трафік","ip"] },
  { id: "terminal",   label: "Термінал",         desc: "SSH до Debian-сервера (телефон)",            icon: <Terminal       size={14} />, keywords: ["термінал","terminal","ssh","debian","shell","bash"] },
  { id: "users",      label: "Користувачі",      desc: "Облікові записи, ролі, статус",              icon: <Users          size={14} />, keywords: ["користувачі","users","admin","player","ban","роль"] },
  { id: "settings",   label: "Налаштування",     desc: "URL бекенду, підключення, конфіг",           icon: <Settings       size={14} />, keywords: ["налаштування","settings","api","url","бекенд","config"] },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query,   setQuery]   = useState("");
  const [focused, setFocused] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim()
    ? ITEMS.filter(it =>
        it.label.toLowerCase().includes(query.toLowerCase()) ||
        it.desc.toLowerCase().includes(query.toLowerCase()) ||
        it.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : ITEMS;


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setQuery("");
        setFocused(0);
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  // clamp focused when results shrink
  const clampedFocused = Math.min(focused, Math.max(0, results.length - 1));


  const go = (id: string) => {
    onNavigate(id);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(f => Math.min(f + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && results[focused]) go(results[focused].id);
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center pt-[12vh]"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "#161b23", border: "1px solid rgba(0,229,255,0.15)", boxShadow: "0 0 60px rgba(0,229,255,0.08)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <Search size={15} className="text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Пошук розділу або функції..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder-gray-600"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-600 hover:text-gray-400 transition-colors">
              <X size={13} />
            </button>
          )}
          <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-600">Нічого не знайдено</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              onMouseEnter={() => setFocused(i)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
              style={{
                background: clampedFocused === i ? "var(--cyan-dim)" : "transparent",
                border: "1px solid transparent",
                ...(clampedFocused === i ? { borderColor: "rgba(0,229,255,0.12)" } : {}),
              }}
            >
              <span style={{ color: clampedFocused === i ? "var(--cyan)" : "#6b7280" }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: clampedFocused === i ? "#e2e8f0" : "#9ca3af" }}>{item.label}</div>
                <div className="text-[11px] text-gray-600 truncate">{item.desc}</div>
              </div>
              {clampedFocused === i && (
                <kbd className="text-[10px] text-gray-600 px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>↵</kbd>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 text-[10px] text-gray-700" style={{ borderTop: "1px solid var(--border)" }}>
          <span><kbd className="font-mono">↑↓</kbd> навігація</span>
          <span><kbd className="font-mono">↵</kbd> відкрити</span>
          <span><kbd className="font-mono">ESC</kbd> закрити</span>
          <span className="ml-auto">NEXUSSRV · Пошук</span>
        </div>
      </div>
    </div>
  );
}

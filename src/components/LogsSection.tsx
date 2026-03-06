"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Filter, XCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

interface LogEntry {
  id: number;
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
}

let _id = 100;

const INIT_LOGS: LogEntry[] = [
  { id: _id++, time: "10:42:01", level: "INFO",  source: "kernel",  message: "System boot sequence initiated." },
  { id: _id++, time: "10:42:05", level: "INFO",  source: "systemd", message: "Mounting root filesystem: success." },
  { id: _id++, time: "10:42:12", level: "WARN",  source: "network", message: "High latency detected on eth0 (120ms)." },
  { id: _id++, time: "10:45:30", level: "INFO",  source: "auth",    message: "User admin logged in from 192.168.1.105" },
  { id: _id++, time: "11:02:15", level: "ERROR", source: "chronyd", message: "Failed to synchronize with NTP server." },
  { id: _id++, time: "11:05:42", level: "INFO",  source: "nginx",   message: "Worker process 1234 started." },
  { id: _id++, time: "11:06:10", level: "WARN",  source: "memory",  message: "Memory usage exceeded 70% threshold." },
];

const POOL: Omit<LogEntry, "id" | "time">[] = [
  { level: "INFO",  source: "kernel",  message: "CPU frequency scaling: 3.4GHz" },
  { level: "INFO",  source: "systemd", message: "Service nginx restarted successfully." },
  { level: "WARN",  source: "memory",  message: "Memory usage exceeded 70% threshold." },
  { level: "ERROR", source: "disk",    message: "Disk I/O error on /dev/sda2." },
  { level: "INFO",  source: "auth",    message: "Session token refreshed for admin." },
  { level: "WARN",  source: "network", message: "Packet loss detected: 2.3%" },
  { level: "INFO",  source: "cron",    message: "Scheduled backup started." },
  { level: "ERROR", source: "sshd",    message: "Failed login attempt from 45.33.32.156" },
  { level: "INFO",  source: "php-fpm", message: "Child process 5678 started." },
];

const levelIcon = { INFO: CheckCircle2, WARN: AlertTriangle, ERROR: XCircle };
const levelColor = { INFO: "#38bdf8", WARN: "#fbbf24", ERROR: "#f87171" };
const levelBg   = { INFO: "rgba(56,189,248,0.08)", WARN: "rgba(251,191,36,0.08)", ERROR: "rgba(248,113,113,0.08)" };

type FilterLevel = "ALL" | "INFO" | "WARN" | "ERROR";

export function LogsSection() {
  const [logs, setLogs]       = useState<LogEntry[]>(INIT_LOGS);
  const [filter, setFilter]   = useState<FilterLevel>("ALL");
  const [paused, setPaused]   = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const pick = POOL[Math.floor(Math.random() * POOL.length)];
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      setLogs(prev => [...prev.slice(-200), { ...pick, id: _id++, time }]);
    }, 2500);
    return () => clearInterval(t);
  }, [paused]);

  // Auto-scroll only when not paused
  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, paused]);

  const visible = filter === "ALL" ? logs : logs.filter(l => l.level === filter);
  const counts = { INFO: logs.filter(l => l.level === "INFO").length, WARN: logs.filter(l => l.level === "WARN").length, ERROR: logs.filter(l => l.level === "ERROR").length };

  const handleExport = () => {
    const text = logs.map(l => `[${l.time}] ${l.level.padEnd(5)} (${l.source}) ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "logs.txt"; a.click();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Системні Логи</h1>
          <p className="text-xs text-gray-500 mt-0.5">{logs.length} записів • Live оновлення</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(p => !p)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: paused ? "rgba(248,113,113,0.1)" : "rgba(56,189,248,0.1)",
              color: paused ? "#f87171" : "#38bdf8",
              border: `1px solid ${paused ? "rgba(248,113,113,0.2)" : "rgba(56,189,248,0.2)"}`,
            }}
          >
            {paused ? "▶ Відновити" : "⏸ Пауза"}
          </button>
          <button onClick={handleExport} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-gray-400 transition-colors hover:text-white" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <Download size={12} /> Експорт
          </button>
        </div>
      </div>

      {/* Counters + filter */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Filter size={13} className="text-gray-500" />
        {(["ALL", "INFO", "WARN", "ERROR"] as FilterLevel[]).map(lvl => {
          const active = filter === lvl;
          const color = lvl === "ALL" ? "#9ca3af" : levelColor[lvl];
          const count = lvl === "ALL" ? logs.length : counts[lvl];
          const Icon = lvl !== "ALL" ? levelIcon[lvl] : Info;
          return (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                color: active ? color : "#6b7280",
                background: active ? (lvl === "ALL" ? "rgba(156,163,175,0.1)" : levelBg[lvl]) : "transparent",
                border: active ? `1px solid ${color}30` : "1px solid var(--border)",
              }}
            >
              <Icon size={11} />
              {lvl} {lvl !== "ALL" && <span className="opacity-60">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Log table — takes remaining height */}
      <div
        className="flex-1 overflow-hidden rounded-xl font-mono text-[11px]"
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
      >
        <div className="h-full overflow-y-auto p-4 space-y-1 leading-6">
          {visible.map(log => {
            const Icon = levelIcon[log.level];
            return (
              <div key={log.id} className="flex flex-wrap gap-x-2 items-start group rounded-md px-2 py-0.5 transition-colors hover:bg-white/[0.03]">
                <span className="text-gray-600 select-none">[{log.time}]</span>
                <span className="flex items-center gap-1 font-bold" style={{ color: levelColor[log.level], minWidth: "3.5rem" }}>
                  <Icon size={10} />
                  {log.level}
                </span>
                <span className="text-gray-600">({log.source})</span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

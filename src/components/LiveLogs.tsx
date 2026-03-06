"use client";

import { useEffect, useRef, useState } from "react";

interface LogEntry {
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
}

const MOCK_LOGS: LogEntry[] = [
  { time: "10:42:01", level: "INFO",  source: "kernel",  message: "System boot sequence initiated." },
  { time: "10:42:05", level: "INFO",  source: "systemd", message: "Mounting root filesystem: success." },
  { time: "10:42:12", level: "WARN",  source: "network", message: "High latency detected on eth0 (120ms)." },
  { time: "10:45:30", level: "INFO",  source: "auth",    message: "User admin logged in from 192.168.1.105" },
  { time: "11:02:15", level: "ERROR", source: "chronyd", message: "Failed to synchronize with NTP server." },
];

function randomLog(): LogEntry {
  const items: LogEntry[] = [
    { time: "", level: "INFO",  source: "kernel",  message: "CPU frequency scaling: 3.4GHz" },
    { time: "", level: "INFO",  source: "systemd", message: "Service nginx restarted successfully." },
    { time: "", level: "WARN",  source: "memory",  message: "Memory usage exceeded 70% threshold." },
    { time: "", level: "ERROR", source: "disk",    message: "Disk I/O error on /dev/sda2." },
    { time: "", level: "INFO",  source: "auth",    message: "Session token refreshed for admin." },
    { time: "", level: "WARN",  source: "network", message: "Packet loss detected: 2.3%" },
  ];
  const pick = items[Math.floor(Math.random() * items.length)];
  const now = new Date();
  pick.time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
  return pick;
}

const levelClass: Record<string, string> = {
  INFO:  "log-info",
  WARN:  "log-warn",
  ERROR: "log-error",
};

export function LiveLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(MOCK_LOGS);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [...prev.slice(-40), randomLog()]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      className="rounded-xl flex flex-col overflow-hidden"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)", height: "100%" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span style={{ color: "var(--cyan)" }}>&gt;_</span>
          Системні Логи <span className="text-gray-500 font-normal">(Live)</span>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-1 rounded text-gray-400 transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}
          >Фільтр</button>
          <button className="text-xs px-3 py-1 rounded text-gray-400 transition-colors" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#fff"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9ca3af"}
          >Експорт</button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 leading-5">
        {logs.map((log, i) => (
          <div key={i} className="flex flex-wrap gap-x-2 text-gray-400">
            <span>[{log.time}]</span>
            <span className={`font-bold ${levelClass[log.level]}`}>{log.level}</span>
            <span className="log-source">({log.source})</span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

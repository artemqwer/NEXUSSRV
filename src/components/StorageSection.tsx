"use client";

import { useEffect, useState } from "react";
import { HardDrive, ArchiveX, RefreshCw, AlertCircle } from "lucide-react";
import { api, ServerStats } from "@/api";

function byteFmt(bytes: number) {
  const gb = bytes / 1073741824;
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${Math.round(gb * 1024)} MB`;
}

function Disk({ p, color }: { p: { mount: string; fs: string; size: number; used: number; use: number }; color: string }) {
  const pct = p.use || Math.round((p.used / p.size) * 100) || 0;
  const warn = pct >= 85;
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive size={14} style={{ color }} />
            <span className="font-semibold text-sm text-white font-mono">{p.mount}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">{p.fs}</div>
        </div>
        {warn && <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: "#f87171" }} />}
      </div>

      {/* Bar */}
      <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700 shadow-lg" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>

      <div className="flex justify-between text-[11px]">
        <span style={{ color }}>{byteFmt(p.used)} використано</span>
        <span className="text-gray-500">{byteFmt(p.size - p.used)} вільно / {byteFmt(p.size)} — <span className="font-mono">{pct}%</span></span>
      </div>
    </div>
  );
}

export function StorageSection() {
  const [stats, setStats] = useState<ServerStats | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    fetchStats();
    const tStats = setInterval(fetchStats, 5000);
    return () => clearInterval(tStats);
  }, []);

  const disks = stats?.storage?.disks || [];
  const totalBytes = disks.reduce((s, p) => s + p.size, 0);
  const usedBytes = disks.reduce((s, p) => s + p.used, 0);
  const pctTotal = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  const isOnline = stats !== null;

  const colors = ["#00e5ff", "#818cf8", "#34d399", "#fbbf24", "#c084fc", "#f87171"];

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Сховище</h1>
          <p className="text-xs text-gray-500 mt-0.5">{isOnline ? `${disks.length} розділів • Загалом ${byteFmt(totalBytes)}` : "Очікування сервера..."}</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <RefreshCw size={12} />
          Оновити
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-5 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Загальний обсяг сховища</div>
            <div className="text-3xl font-bold text-white">{isOnline ? byteFmt(totalBytes) : "0 MB"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Використано</div>
            <div className="text-3xl font-bold" style={{ color: pctTotal >= 85 ? "#f87171" : "#34d399" }}>{pctTotal}%</div>
          </div>
        </div>
        {/* Master bar */}
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctTotal}%`, background: "linear-gradient(90deg,#00e5ff,#818cf8,#f87171)", boxShadow: "0 0 12px rgba(0,229,255,0.3)" }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{isOnline ? byteFmt(usedBytes) : 0} використано</span>
          <span>{isOnline ? byteFmt(totalBytes - usedBytes) : 0} вільно</span>
        </div>
      </div>

      {/* Partition grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {disks.map((p, i) => <Disk key={p.mount} p={p} color={colors[i % colors.length]} />)}
      </div>

      {/* Empty drives placeholder */}
      <div className="rounded-xl p-5 flex items-center gap-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px dashed rgba(255,255,255,0.08)" }}>
        <ArchiveX size={20} className="text-gray-600 shrink-0" />
        <div className="text-sm text-gray-600">Не підключено додаткових дисків</div>
      </div>
    </div>
  );
}

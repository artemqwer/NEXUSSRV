"use client";

import { HardDrive, ArchiveX, RefreshCw, AlertCircle } from "lucide-react";

interface Partition {
  mount: string;
  device: string;
  fs: string;
  total: number;    // GB
  used: number;     // GB
  color: string;
}

const PARTITIONS: Partition[] = [
  { mount: "/",         device: "/dev/sda1", fs: "ext4",  total: 500,  used: 180,  color: "#00e5ff" },
  { mount: "/home",     device: "/dev/sda2", fs: "ext4",  total: 1000, used: 640,  color: "#818cf8" },
  { mount: "/var",      device: "/dev/sda3", fs: "ext4",  total: 200,  used: 95,   color: "#34d399" },
  { mount: "/boot",     device: "/dev/sda4", fs: "vfat",  total: 1,    used: 0.4,  color: "#fbbf24" },
  { mount: "/tmp",      device: "tmpfs",     fs: "tmpfs", total: 32,   used: 2.1,  color: "#c084fc" },
  { mount: "/mnt/data", device: "/dev/sdb1", fs: "xfs",   total: 4000, used: 2300, color: "#f87171" },
];

function byteFmt(gb: number) {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  if (gb >= 1)    return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
  return `${Math.round(gb * 1024)} MB`;
}

function Disk({ p }: { p: Partition }) {
  const pct = Math.round((p.used / p.total) * 100);
  const warn = pct >= 85;
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive size={14} style={{ color: p.color }} />
            <span className="font-semibold text-sm text-white font-mono">{p.mount}</span>
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">{p.device} • {p.fs}</div>
        </div>
        {warn && <AlertCircle size={15} className="shrink-0 mt-0.5" style={{ color: "#f87171" }} />}
      </div>

      {/* Bar */}
      <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700 shadow-lg" style={{ width: `${pct}%`, background: p.color, boxShadow: `0 0 8px ${p.color}60` }} />
      </div>

      <div className="flex justify-between text-[11px]">
        <span style={{ color: p.color }}>{byteFmt(p.used)} використано</span>
        <span className="text-gray-500">{byteFmt(p.total - p.used)} вільно / {byteFmt(p.total)} — <span className="font-mono">{pct}%</span></span>
      </div>
    </div>
  );
}

export function StorageSection() {
  const total    = PARTITIONS.reduce((s, p) => s + p.total, 0);
  const used     = PARTITIONS.reduce((s, p) => s + p.used,  0);
  const pctTotal = Math.round(used / total * 100);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Сховище</h1>
          <p className="text-xs text-gray-500 mt-0.5">{PARTITIONS.length} розділів • Загалом {byteFmt(total)}</p>
        </div>
        <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-colors" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <RefreshCw size={12} />
          Оновити
        </button>
      </div>

      {/* Summary card */}
      <div className="rounded-xl p-5 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Загальний обсяг сховища</div>
            <div className="text-3xl font-bold text-white">{byteFmt(total)}</div>
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
          <span>{byteFmt(used)} використано</span>
          <span>{byteFmt(total - used)} вільно</span>
        </div>
      </div>

      {/* Partition grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PARTITIONS.map(p => <Disk key={p.mount} p={p} />)}
      </div>

      {/* Empty drives placeholder */}
      <div className="rounded-xl p-5 flex items-center gap-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px dashed rgba(255,255,255,0.08)" }}>
        <ArchiveX size={20} className="text-gray-600 shrink-0" />
        <div className="text-sm text-gray-600">Не підключено додаткових дисків</div>
      </div>
    </div>
  );
}

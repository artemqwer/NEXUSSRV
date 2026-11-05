"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { Cpu, MemoryStick, Network, Thermometer, Gauge, Layers, HardDrive, Users, Activity, Box } from "lucide-react";

const MAX_POINTS = 20;

interface Point {
  time: string;
  cpu: number;
  ram: number;
  net: number;
  temp: number;
}

import { api, ServerStats } from "@/api";
import { AgentBadge, DataAge } from "@/components/AgentStatus";

function initData(): Point[] {
  const arr: Point[] = [];
  const now = Date.now();
  for (let i = MAX_POINTS - 1; i >= 0; i--) {
    const d = new Date(now - i * 3000);
    const t = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
    arr.push({ time: t, cpu: 0, ram: 0, net: 0, temp: 0 });
  }
  return arr;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px] font-mono shadow-xl" style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-bold">{p.value}{p.name === "Мережа" ? " Mbps" : "%"}</span>
        </div>
      ))}
    </div>
  );
};

interface MetricCardProps { label: string; value: string; sub: string; color: string; icon: React.ReactNode }
function MetricCard({ label, value, sub, color, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}

export function MonitoringSection() {
  const [data, setData] = useState<Point[]>(initData);
  const [stats, setStats] = useState<ServerStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const s = await api.getStats();
        if (!s) throw new Error();
        setStats(s);

        const now = new Date();
        const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
        
        // aggregate overall network traffic across interfaces
        let netSpeed = 0;
        if (s.network?.interfaces && s.network.interfaces.length > 0) {
           const primary = s.network.interfaces.find(i => i.name.startsWith("wl") || i.name.startsWith("en") || i.name.startsWith("eth")) || s.network.interfaces[0];
           netSpeed = (primary.rxRate + primary.txRate) / 125000;
        }

        setData(prev => {
          const newPt: Point = {
            time,
            cpu: Math.round(s.cpu?.usage ?? 0),
            ram: Math.round(s.ram?.percent ?? 0),
            net: Math.round(netSpeed),
            temp: Math.round(s.cpu?.temp ?? 0),
          };
          return [...prev.slice(-(MAX_POINTS - 1)), newPt];
        });
      } catch {
        setStats(null);
        // keep adding zero points to flush out old data
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
        setData(prev => [...prev.slice(-(MAX_POINTS - 1)), { time, cpu: 0, ram: 0, net: 0, temp: 0 }]);
      }
    };
    
    fetchStats();
    const t = setInterval(fetchStats, 3000);
    return () => clearInterval(t);
  }, []);

  const latest = data[data.length - 1];
  const isOnline = stats !== null;

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Моніторинг</h1>
          <p className="text-xs text-gray-500 mt-0.5">Оновлення кожні 3 секунди • Live</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DataAge stats={stats} />
          <AgentBadge stats={stats} />
        </div>
      </div>

      {/* Live metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <MetricCard label="ЦП" value={isOnline ? `${latest.cpu}%` : "—"} sub={`${stats?.cpu?.cores || 0} cores`} color="#00e5ff" icon={<Cpu size={15} />} />
        <MetricCard label="RAM" value={isOnline ? `${latest.ram}%` : "—"} sub={isOnline ? `~${Math.round((stats?.ram?.used || 0)/1024)} / ${Math.round((stats?.ram?.total || 0)/1024)} GB` : "—"} color="#818cf8" icon={<MemoryStick size={15} />} />
        <MetricCard label="Мережа" value={isOnline ? `${latest.net} Mbps` : "—"} sub="Всі інтерфейси (Rx+Tx)" color="#c084fc" icon={<Network size={15} />} />
        <MetricCard label="Температура" value={isOnline ? `${latest.temp}°C` : "—"} sub="CPU Thermal" color="#fbbf24" icon={<Thermometer size={15} />} />
      </div>

      {/* Load / Swap / Disk I/O / Система */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          label="Load Average"
          value={isOnline && stats?.cpu?.load ? stats.cpu.load.one.toFixed(2) : "—"}
          sub={isOnline && stats?.cpu?.load ? `5м: ${stats.cpu.load.five.toFixed(2)} • 15м: ${stats.cpu.load.fifteen.toFixed(2)}` : "—"}
          color="#fb923c"
          icon={<Gauge size={15} />}
        />
        <MetricCard
          label="Swap"
          value={isOnline && stats?.ram?.swap ? `${Math.round(stats.ram.swap.percent)}%` : "—"}
          sub={isOnline && stats?.ram?.swap ? `${+(stats.ram.swap.used / 1073741824).toFixed(1)} / ${+(stats.ram.swap.total / 1073741824).toFixed(1)} GB` : "—"}
          color="#f472b6"
          icon={<Layers size={15} />}
        />
        <MetricCard
          label="Диск I/O"
          value={isOnline && stats?.storage?.io ? `${(stats.storage.io.readRate / 1048576).toFixed(1)} MB/s` : "—"}
          sub={isOnline && stats?.storage?.io ? `Write: ${(stats.storage.io.writeRate / 1048576).toFixed(1)} MB/s` : "—"}
          color="#38bdf8"
          icon={<HardDrive size={15} />}
        />
        <MetricCard
          label="Система"
          value={isOnline && stats?.system ? (stats.system.failedUnits ?? 0) > 0 ? `${stats.system.failedUnits}` : "OK" : "—"}
          sub={isOnline && stats?.system ? `Юзери: ${stats.system.users.names.join(", ") || "—"} (${stats.system.users.count})` : "—"}
          color={isOnline && stats?.system && (stats.system.failedUnits ?? 0) > 0 ? "#f87171" : "#34d399"}
          icon={<Users size={15} />}
        />
      </div>

      {/* CPU + RAM Chart */}
      <div className="rounded-xl p-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold text-white mb-4">ЦП та RAM (%) — останні 60 сек</div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRam" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
            <Area type="monotone" dataKey="cpu"  name="ЦП"  stroke="#00e5ff" fill="url(#gradCpu)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="ram"  name="RAM" stroke="#818cf8" fill="url(#gradRam)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Network + Temp chart */}
      <div className="rounded-xl p-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold text-white mb-4">Мережа (Mbps) та Температура (°C) — останні 60 сек</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
            <Line type="monotone" dataKey="net"  name="Мережа"      stroke="#c084fc" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="temp" name="Температура" stroke="#fbbf24" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Процеси + Docker */}
      <div className="grid md:grid-cols-2 gap-4 shrink-0">
        {/* Top процеси */}
        <div className="rounded-xl p-4" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Activity size={15} style={{ color: "#00e5ff" }} />
            Топ процесів (CPU)
            <span className="ml-auto text-[10px] font-normal text-gray-600">агент v1+</span>
          </div>
          {stats?.processes?.length ? (
            <div className="flex flex-col gap-2.5">
              {stats.processes.map((p) => (
                <div key={p.pid} className="flex items-center gap-3 text-xs">
                  <span className="w-36 truncate text-gray-300" title={p.name}>{p.name}</span>
                  <span className="w-16 text-[10px] text-gray-600 font-mono">#{p.pid}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(p.cpu, 100)}%`, background: "#00e5ff" }} />
                  </div>
                  <span className="w-14 text-right font-mono" style={{ color: "#00e5ff" }}>{p.cpu}%</span>
                  <span className="w-12 text-right font-mono text-gray-500">{p.mem}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 py-2">
              {isOnline ? "Немає даних — онови агента на сервері" : "Немає зв'язку"}
            </div>
          )}
        </div>

        {/* Docker */}
        <div className="rounded-xl p-4" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Box size={15} style={{ color: "#38bdf8" }} />
            Docker
            {stats?.docker?.available ? (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-normal" style={{ color: "#34d399" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {stats.docker.containers.length} контейнерів
              </span>
            ) : (
              <span className="ml-auto text-[10px] font-normal text-gray-600">
                {stats === null ? "офлайн" : stats?.docker ? "недоступний" : "немає даних"}
              </span>
            )}
          </div>
          {stats?.docker?.available && stats.docker.containers.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {stats.docker.containers.map((c) => (
                <div key={c.name} className="flex items-center gap-3 text-xs">
                  <span className="w-32 truncate text-gray-300" title={c.name}>{c.name}</span>
                  <span className="flex-1 truncate text-[10px] text-gray-600 font-mono">{c.image}</span>
                  <span
                    className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={c.status.startsWith("Up")
                      ? { background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }
                      : { background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-600 py-2">
              {stats?.docker?.available ? "Контейнерів немає" : isOnline ? "Docker не містить контейнерів або недоступний" : "Немає зв'язку"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

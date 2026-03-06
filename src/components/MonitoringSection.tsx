"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { Cpu, MemoryStick, Network, Thermometer } from "lucide-react";

const MAX_POINTS = 20;

interface Point {
  time: string;
  cpu: number;
  ram: number;
  net: number;
  temp: number;
}

function initData(): Point[] {
  const arr: Point[] = [];
  const now = Date.now();
  for (let i = MAX_POINTS - 1; i >= 0; i--) {
    const d = new Date(now - i * 3000);
    const t = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
    arr.push({ time: t, cpu: 35 + Math.round(Math.random() * 25), ram: 48 + Math.round(Math.random() * 10), net: 60 + Math.round(Math.random() * 30), temp: 63 + Math.round(Math.random() * 10) });
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
  const latest = data[data.length - 1];

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      setData(prev => {
        const last = prev[prev.length - 1];
        const newPt: Point = {
          time,
          cpu:  Math.max(5,  Math.min(95,  last.cpu  + (Math.random() - 0.5) * 10)),
          ram:  Math.max(40, Math.min(90,  last.ram  + (Math.random() - 0.5) * 4)),
          net:  Math.max(10, Math.min(100, last.net  + (Math.random() - 0.5) * 20)),
          temp: Math.max(50, Math.min(90,  last.temp + (Math.random() - 0.5) * 3)),
        };
        newPt.cpu  = Math.round(newPt.cpu);
        newPt.ram  = Math.round(newPt.ram);
        newPt.net  = Math.round(newPt.net);
        newPt.temp = Math.round(newPt.temp);
        return [...prev.slice(-(MAX_POINTS - 1)), newPt];
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Моніторинг</h1>
        <p className="text-xs text-gray-500 mt-0.5">Оновлення кожні 3 секунди • Live</p>
      </div>

      {/* Live metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 shrink-0">
        <MetricCard label="ЦП" value={`${latest.cpu}%`} sub="AMD EPYC 7742" color="#00e5ff" icon={<Cpu size={15} />} />
        <MetricCard label="RAM" value={`${latest.ram}%`} sub={`~${Math.round(latest.ram * 2.56)} / 256 GB`} color="#818cf8" icon={<MemoryStick size={15} />} />
        <MetricCard label="Мережа" value={`${latest.net} Mbps`} sub="eth0 (1Gbps)" color="#c084fc" icon={<Network size={15} />} />
        <MetricCard label="Температура" value={`${latest.temp}°C`} sub="DDR5 DIMM_A1" color="#fbbf24" icon={<Thermometer size={15} />} />
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
    </div>
  );
}

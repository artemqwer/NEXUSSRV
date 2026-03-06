"use client";

import { useEffect, useState } from "react";
import { Globe, Wifi, WifiOff, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Interface {
  name: string;
  ip: string;
  mac: string;
  status: "up" | "down";
  speed: string;
  rx: number;   // MB
  tx: number;   // MB
  rxRate: number;   // Mbps
  txRate: number;
}

const INTERFACES: Interface[] = [
  { name: "eth0",  ip: "192.168.0.103", mac: "e4:5f:01:2a:bb:cc", status: "up",   speed: "1 Gbps",  rx: 45600, tx: 8200,  rxRate: 0, txRate: 0 },
  { name: "eth1",  ip: "10.0.0.1",      mac: "e4:5f:01:2a:bb:dd", status: "down", speed: "10 Gbps", rx: 0,     tx: 0,     rxRate: 0, txRate: 0 },
  { name: "lo",    ip: "127.0.0.1",     mac: "00:00:00:00:00:00", status: "up",   speed: "—",       rx: 120,   tx: 120,   rxRate: 0, txRate: 0 },
];

interface PingTarget { host: string; ip: string; latency: number | null }
const PING_TARGETS: PingTarget[] = [
  { host: "Google DNS",  ip: "8.8.8.8",     latency: 12 },
  { host: "Cloudflare",  ip: "1.1.1.1",     latency: 9 },
  { host: "Шлюз",        ip: "192.168.0.1", latency: 1 },
  { host: "GitHub",      ip: "140.82.112.3", latency: 28 },
];

const MAX_PTS = 20;
interface TrafficPt { time: string; rx: number; tx: number }

function initTraffic(): TrafficPt[] {
  const arr: TrafficPt[] = [];
  const now = Date.now();
  for (let i = MAX_PTS - 1; i >= 0; i--) {
    const d = new Date(now - i * 3000);
    arr.push({
      time: `${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`,
      rx: 60 + Math.round(Math.random() * 400),
      tx: 20 + Math.round(Math.random() * 150),
    });
  }
  return arr;
}

const CustomTooltip = ({ active, payload, label }: {active?:boolean;payload?:{color:string;name:string;value:number}[];label?:string}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px] shadow-xl" style={{ background: "#1a2030", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-bold">{p.value} Mbps</span>
        </div>
      ))}
    </div>
  );
};

export function NetworkSection() {
  const [traffic, setTraffic] = useState<TrafficPt[]>(initTraffic);
  const [pings,   setPings]   = useState<PingTarget[]>(PING_TARGETS);

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
      setTraffic(prev => {
        const last = prev[prev.length - 1];
        return [...prev.slice(-(MAX_PTS - 1)), {
          time,
          rx: Math.max(10, Math.min(800, last.rx + (Math.random() - 0.5) * 100)),
          tx: Math.max(5,  Math.min(300, last.tx + (Math.random() - 0.5) * 50)),
        }];
      });
      // Simulate ping jitter
      setPings(prev => prev.map(p => ({
        ...p,
        latency: p.latency !== null ? Math.max(1, p.latency + Math.round((Math.random() - 0.5) * 5)) : null,
      })));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const latest = traffic[traffic.length - 1];

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      <div>
        <h1 className="text-xl font-bold text-white">Мережа</h1>
        <p className="text-xs text-gray-500 mt-0.5">Live моніторинг трафіку та інтерфейсів</p>
      </div>

      {/* Interfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {INTERFACES.map(iface => (
          <div key={iface.name} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {iface.status === "up" ? <Wifi size={14} style={{ color: "#34d399" }} /> : <WifiOff size={14} style={{ color: "#6b7280" }} />}
                <span className="font-mono font-bold text-sm text-white">{iface.name}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                background: iface.status === "up" ? "rgba(52,211,153,0.1)" : "rgba(107,114,128,0.1)",
                color: iface.status === "up" ? "#34d399" : "#6b7280",
                border: `1px solid ${iface.status === "up" ? "rgba(52,211,153,0.2)" : "rgba(107,114,128,0.2)"}`,
              }}>{iface.status.toUpperCase()}</span>
            </div>
            <div className="font-mono text-xs text-gray-400">{iface.ip}</div>
            <div className="font-mono text-[10px] text-gray-600">{iface.mac}</div>
            <div className="pt-1 flex justify-between text-[10px] text-gray-600">
              <span>↓ {(iface.rx / 1024).toFixed(1)} GB</span>
              <span>↑ {(iface.tx / 1024).toFixed(1)} GB</span>
              <span className="text-gray-500">{iface.speed}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Traffic chart */}
      <div className="rounded-xl p-4 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={14} style={{ color: "var(--cyan)" }} />
            Трафік eth0 — Live
          </div>
          <div className="flex gap-4 text-xs">
            <span style={{ color: "#00e5ff" }}>↓ {Math.round(latest.rx)} Mbps RX</span>
            <span style={{ color: "#c084fc" }}>↑ {Math.round(latest.tx)} Mbps TX</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={traffic} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gRx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#00e5ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#c084fc" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="rx" name="RX" stroke="#00e5ff" fill="url(#gRx)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="tx" name="TX" stroke="#c084fc" fill="url(#gTx)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Ping table */}
      <div className="rounded-xl overflow-hidden shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <div className="px-4 py-3 flex items-center gap-2 text-sm font-semibold text-white" style={{ borderBottom: "1px solid var(--border)" }}>
          <Globe size={14} style={{ color: "var(--cyan)" }} />
          Моніторинг Ping
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider" style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="px-4 py-2 text-left font-semibold">Хост</th>
              <th className="px-4 py-2 text-left font-semibold">IP</th>
              <th className="px-4 py-2 text-right font-semibold">Затримка</th>
              <th className="px-4 py-2 text-right font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {pings.map(p => (
              <tr key={p.host} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-gray-200">{p.host}</td>
                <td className="px-4 py-3 font-mono text-gray-500">{p.ip}</td>
                <td className="px-4 py-3 text-right font-mono" style={{ color: (p.latency ?? 0) < 20 ? "#34d399" : (p.latency ?? 0) < 50 ? "#fbbf24" : "#f87171" }}>
                  {p.latency !== null ? `${p.latency} ms` : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center gap-1" style={{ color: "#34d399" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

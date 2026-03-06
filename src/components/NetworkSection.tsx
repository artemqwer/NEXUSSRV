"use client";

import { useEffect, useState } from "react";
import { Globe, Wifi, WifiOff, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, ServerStats } from "@/api";

const MAX_PTS = 20;
interface TrafficPt { time: string; rx: number; tx: number }

function initTraffic(): TrafficPt[] {
  const arr: TrafficPt[] = [];
  const now = Date.now();
  for (let i = MAX_PTS - 1; i >= 0; i--) {
    const d = new Date(now - i * 3000);
    arr.push({
      time: `${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`,
      rx: 0,
      tx: 0,
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
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficPt[]>(initTraffic);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        if (!data) throw new Error("No data");
        setStats(data);
        const now = new Date();
        const time = `${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;

        // Find primary interface for charting (usually wlan0 or eth0 or en0)
        let primaryRx = 0;
        let primaryTx = 0;
        if (data.network?.interfaces && data.network.interfaces.length > 0) {
          const primary = data.network.interfaces.find(i => i.name.startsWith("wl") || i.name.startsWith("en") || i.name.startsWith("eth")) || data.network.interfaces[0];
          primaryRx = primary.rxRate;
          primaryTx = primary.txRate;
        }

        setTraffic(prev => {
          return [...prev.slice(-(MAX_PTS - 1)), {
            time, rx: primaryRx, tx: primaryTx,
          }];
        });

      } catch (_) {
        setStats(null);
        // Add 0 pt if offline
        const now = new Date();
        const time = `${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
        setTraffic(prev => [...prev.slice(-(MAX_PTS - 1)), { time, rx: 0, tx: 0 }]);
      }
    };

    fetchStats();
    const tStats = setInterval(fetchStats, 3000);
    return () => clearInterval(tStats);
  }, []);

  const latest = traffic[traffic.length - 1];
  const isOnline = stats !== null;
  const interfaces = stats?.network?.interfaces || [];

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      <div>
        <h1 className="text-xl font-bold text-white">Мережа</h1>
        <p className="text-xs text-gray-500 mt-0.5">Live моніторинг трафіку та інтерфейсів</p>
      </div>

      {/* Interfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
        {interfaces.length > 0 ? interfaces.map(iface => {
          const isUp = iface.status === "up" || iface.status === "running" || iface.status === "unknown"; // linux sometimes reports unknown
          return (
            <div key={iface.name} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUp ? <Wifi size={14} style={{ color: "#34d399" }} /> : <WifiOff size={14} style={{ color: "#6b7280" }} />}
                  <span className="font-mono font-bold text-sm text-white">{iface.name}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{
                  background: isUp ? "rgba(52,211,153,0.1)" : "rgba(107,114,128,0.1)",
                  color: isUp ? "#34d399" : "#6b7280",
                  border: `1px solid ${isUp ? "rgba(52,211,153,0.2)" : "rgba(107,114,128,0.2)"}`,
                }}>{iface.status.toUpperCase()}</span>
              </div>
              <div className="font-mono text-xs text-gray-400">{iface.ip || "Немає IP"}</div>
              <div className="font-mono text-[10px] text-gray-600">{iface.mac || "Немає MAC"}</div>
              <div className="pt-1 flex justify-between text-[10px] text-gray-600">
                <span>↓ {(iface.rx / 1073741824).toFixed(1)} GB</span>
                <span>↑ {(iface.tx / 1073741824).toFixed(1)} GB</span>
                <span className="text-gray-500">{iface.speed > 0 ? `${iface.speed} Mbps` : "—"}</span>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full rounded-xl p-6 flex items-center justify-center text-gray-500" style={{ background: "var(--card-bg)", border: "1px dashed var(--border)" }}>
            Немає даних про мережеві інтерфейси
          </div>
        )}
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
            <tr className="hover:bg-white/2 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-200">Відповідь шлюзу/Інтернет</td>
              <td className="px-4 py-3 font-mono text-gray-500">Автоматично</td>
              <td className="px-4 py-3 text-right font-mono" style={{ color: (stats?.network?.ping ?? 0) < 50 ? "#34d399" : (stats?.network?.ping ?? 0) < 150 ? "#fbbf24" : "#f87171" }}>
                {isOnline && stats?.network?.ping !== null ? `${stats.network.ping} ms` : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                {isOnline ? (
                  <span className="inline-flex items-center gap-1" style={{ color: "#34d399" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1" style={{ color: "#6b7280" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    Offline
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

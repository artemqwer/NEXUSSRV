"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Hourglass } from "lucide-react";
import { ServerStats } from "@/api";

// Бейдж версії агента: v2 якщо у семплі є поля v2 (processes/system/load)
export function AgentBadge({ stats }: { stats: ServerStats | null }) {
  if (!stats) return null;
  const isV2 = !!(stats.processes || stats.system || stats.cpu?.load);
  return isV2 ? (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}
    >
      <CheckCircle2 size={10} />
      Агент v2
    </span>
  ) : (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
      title="Пусти агента v2, щоб бачити load, процеси, docker та алерти по failed-юнітах"
      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}
    >
      <AlertTriangle size={10} />
      Старий агент — онови
    </span>
  );
}

// Наскільки свіжий останній семпл агента (stats.timestamp)
export function DataAge({ stats }: { stats: ServerStats | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!stats?.timestamp) return null;
  const ts = new Date(stats.timestamp).getTime();
  if (Number.isNaN(ts)) return null;
  const age = Math.max(0, Math.round((Date.now() - ts) / 1000));

  let label = "дані свіжі";
  let color = "#34d399";
  if (age >= 60) {
    label = `дані застарілі: ${Math.floor(age / 60)} хв тому`;
    color = "#f87171";
  } else if (age >= 20) {
    label = `дані ${age} с тому`;
    color = "#fbbf24";
  }
  return (
    <span
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ background: `${color}14`, border: `1px solid ${color}33`, color }}
    >
      <Hourglass size={10} />
      {label}
    </span>
  );
}

"use client";

import { useEffect, useRef } from "react";

interface TemperatureGaugeProps {
  value: number; // 0-100
  maxTemp?: number;
  label?: string;
}

export function TemperatureGauge({ value, maxTemp = 100, label = "DDR5 DIMM_A1" }: TemperatureGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const radius = W / 2 - 12;
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const progress = value / maxTemp;
    const currentAngle = startAngle + (endAngle - startAngle) * progress;

    ctx.clearRect(0, 0, W, H);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#3b82f6");
    grad.addColorStop(0.5, "#f59e0b");
    grad.addColorStop(1, "#ef4444");

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, currentAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    // Glow at tip
    const tipX = cx + radius * Math.cos(currentAngle);
    const tipY = cy + radius * Math.sin(currentAngle);
    const glow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 16);
    glow.addColorStop(0, "rgba(245,158,11,0.6)");
    glow.addColorStop(1, "rgba(245,158,11,0)");
    ctx.beginPath();
    ctx.arc(tipX, tipY, 16, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }, [value, maxTemp]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <canvas ref={canvasRef} width={140} height={140} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{value}°C</span>
          <span className="text-[10px] text-gray-500 mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  );
}

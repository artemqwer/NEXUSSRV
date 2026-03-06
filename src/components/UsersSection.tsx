"use client";

import { useState } from "react";
import { UserPlus, Search, Shield, MoreVertical, CheckCircle2, XCircle, Clock } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Moderator" | "VIP" | "Player";
  status: "online" | "offline" | "banned";
  lastSeen: string;
  ip: string;
}

const USERS: User[] = [
  { id: 1,  name: "Admin_Pro",    email: "admin@nexus.srv",    role: "Owner",     status: "online",  lastSeen: "Зараз",      ip: "192.168.1.1" },
  { id: 2,  name: "Killer777",    email: "killer@mail.com",    role: "Admin",      status: "online",  lastSeen: "Зараз",      ip: "95.18.22.103" },
  { id: 3,  name: "Noob_Master",  email: "noob@mail.com",      role: "Player",     status: "offline", lastSeen: "2 год. тому", ip: "178.45.12.88" },
  { id: 4,  name: "Viking2000",   email: "viking@ua.net",      role: "VIP",        status: "online",  lastSeen: "Зараз",      ip: "37.52.11.200" },
  { id: 5,  name: "Shadow",       email: "shadow@nexus.srv",   role: "Moderator",  status: "offline", lastSeen: "1 год. тому", ip: "10.0.0.42" },
  { id: 6,  name: "CrazyFox",     email: "fox@gmail.com",      role: "Player",     status: "banned",  lastSeen: "3 дні тому", ip: "91.140.1.55" },
  { id: 7,  name: "NightOwl",     email: "owl@ua.net",         role: "VIP",        status: "online",  lastSeen: "Зараз",      ip: "77.88.21.6" },
  { id: 8,  name: "ProGamer99",   email: "pro@gaming.com",     role: "Player",     status: "offline", lastSeen: "5 год. тому", ip: "46.98.77.111" },
];

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  Owner:     { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  Admin:     { bg: "rgba(248,113,113,0.1)", text: "#f87171", border: "rgba(248,113,113,0.2)" },
  Moderator: { bg: "rgba(0,229,255,0.1)",   text: "#00e5ff", border: "rgba(0,229,255,0.2)" },
  VIP:       { bg: "rgba(192,132,252,0.1)", text: "#c084fc", border: "rgba(192,132,252,0.2)" },
  Player:    { bg: "rgba(107,114,128,0.1)", text: "#9ca3af", border: "rgba(107,114,128,0.2)" },
};

const statusIcon = { online: CheckCircle2, offline: Clock, banned: XCircle };
const statusColor = { online: "#34d399", offline: "#6b7280", banned: "#f87171" };
const statusLabel = { online: "Online", offline: "Offline", banned: "Заблокований" };

export function UsersSection() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = USERS.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:     USERS.length,
    online:  USERS.filter(u => u.status === "online").length,
    offline: USERS.filter(u => u.status === "offline").length,
    banned:  USERS.filter(u => u.status === "banned").length,
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Користувачі</h1>
          <p className="text-xs text-gray-500 mt-0.5">{USERS.length} акаунтів • {counts.online} online</p>
        </div>
        <button className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-all" style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}>
          <UserPlus size={13} />
          Додати користувача
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        {/* Status filter */}
        <div className="flex items-center gap-1">
          {(["all","online","offline","banned"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all capitalize"
              style={{
                background: filterStatus === s ? "var(--cyan-dim)" : "transparent",
                color: filterStatus === s ? "var(--cyan)" : "#6b7280",
                border: filterStatus === s ? "1px solid rgba(0,229,255,0.2)" : "1px solid var(--border)",
              }}
            >
              {s === "all" ? "Всі" : statusLabel[s]} ({counts[s]})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg ml-auto" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <Search size={12} className="text-gray-500 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук гравця..."
            className="bg-transparent outline-none text-xs text-gray-300 w-40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider text-[10px]" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
              <th className="px-4 py-3 text-left font-semibold">Гравець</th>
              <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Роль</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">IP</th>
              <th className="px-4 py-3 text-left font-semibold">Статус</th>
              <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Останній раз</th>
              <th className="px-4 py-3 text-right font-semibold">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => {
              const role    = roleColors[u.role];
              const StIcon  = statusIcon[u.status];
              return (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                        style={{ background: `${role.bg}`, color: role.text, border: `1px solid ${role.border}` }}>
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-200">{u.name}</span>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide"
                      style={{ background: role.bg, color: role.text, border: `1px solid ${role.border}` }}>
                      <Shield size={9} />
                      {u.role}
                    </span>
                  </td>
                  {/* IP */}
                  <td className="px-4 py-3 font-mono text-gray-600 hidden md:table-cell">{u.ip}</td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5" style={{ color: statusColor[u.status] }}>
                      <StIcon size={11} />
                      <span className="hidden lg:inline">{statusLabel[u.status]}</span>
                    </span>
                  </td>
                  {/* Last seen */}
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{u.lastSeen}</td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors">
                      <MoreVertical size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-gray-600 text-sm">Нічого не знайдено</div>
        )}
      </div>
    </div>
  );
}

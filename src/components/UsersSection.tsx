"use client";

import { UserPlus, Search, Shield, MoreVertical, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

interface User {
  id: number;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Moderator" | "VIP" | "Player";
  status: "online" | "offline" | "banned";
  lastSeen: string;
  ip: string;
}



const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  Owner:     { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  owner:     { bg: "rgba(251,191,36,0.1)",  text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  Admin:     { bg: "rgba(248,113,113,0.1)", text: "#f87171", border: "rgba(248,113,113,0.2)" },
  admin:     { bg: "rgba(248,113,113,0.1)", text: "#f87171", border: "rgba(248,113,113,0.2)" },
  Moderator: { bg: "rgba(0,229,255,0.1)",   text: "#00e5ff", border: "rgba(0,229,255,0.2)" },
  VIP:       { bg: "rgba(192,132,252,0.1)", text: "#c084fc", border: "rgba(192,132,252,0.2)" },
  Player:    { bg: "rgba(107,114,128,0.1)", text: "#9ca3af", border: "rgba(107,114,128,0.2)" },
  player:    { bg: "rgba(107,114,128,0.1)", text: "#9ca3af", border: "rgba(107,114,128,0.2)" },
};

const statusIcon = { online: CheckCircle2, offline: Clock, banned: XCircle };
const statusColor = { online: "#34d399", offline: "#6b7280", banned: "#f87171" };
const statusLabel = { online: "Online", offline: "Offline", banned: "Заблокований" };

import { useState, useEffect } from "react";

export function UsersSection({ currentUser }: { currentUser?: { displayName: string; role: string } | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLogin, setFormLogin] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("player");
  const [formError, setFormError] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: formLogin, displayName: formDisplayName, password: formPassword, role: formRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Помилка");
      } else {
        setIsModalOpen(false);
        setFormLogin("");
        setFormPassword("");
        setFormDisplayName("");
        setFormRole("player");
        fetchUsers();
      }
    } catch {
      setFormError("Сервер не відповідає");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Дійсно видалити користувача?")) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const d = await res.json();
        alert(d.error || "Помилка видалення");
      }
    } catch (e) {
      alert("Сервер не відповідає");
    }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:     users.length,
    online:  users.filter(u => u.status === "online").length,
    offline: users.filter(u => u.status === "offline").length,
    banned:  users.filter(u => u.status === "banned").length,
  };

  const canManage = currentUser?.role === "owner" || currentUser?.role === "admin";

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pb-2">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Користувачі</h1>
          <p className="text-xs text-gray-500 mt-0.5">{users.length} акаунтів • {counts.online} online</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium transition-all" 
            style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
          >
            <UserPlus size={13} />
            Додати користувача
          </button>
        )}
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
                    <div className="flex justify-end items-center gap-1">
                      {canManage && u.email !== "admin" && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)}
                          title="Видалити користувача"
                          className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button className="p-1.5 rounded-md text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-colors">
                        <MoreVertical size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && <div className="py-10 text-center text-gray-600 text-sm">Завантаження бази...</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-10 text-center text-gray-600 text-sm">Нічого не знайдено</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#161b23", border: "1px solid rgba(0,229,255,0.15)", boxShadow: "0 0 60px rgba(0,229,255,0.08)" }}>
            <h2 className="text-lg font-bold text-white mb-4">Створити акаунт</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase">Логін</label>
                <input value={formLogin} onChange={e => setFormLogin(e.target.value)} required className="w-full px-3 py-2 rounded-lg text-sm bg-black/20 text-white outline-none border border-white/10 focus:border-cyan-500/50" placeholder="admin2" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase">Ім&apos;я (опційно)</label>
                <input value={formDisplayName} onChange={e => setFormDisplayName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-black/20 text-white outline-none border border-white/10 focus:border-cyan-500/50" placeholder="Адмін Плюс" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase">Роль</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm bg-black/20 text-white outline-none border border-white/10 focus:border-cyan-500/50">
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="vip">VIP</option>
                  <option value="player">Player</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-500 uppercase">Пароль</label>
                <input value={formPassword} onChange={e => setFormPassword(e.target.value)} required type="password" className="w-full px-3 py-2 rounded-lg text-sm bg-black/20 text-white outline-none border border-white/10 focus:border-cyan-500/50" placeholder="••••••" />
              </div>
              {formError && <div className="text-xs text-red-400">{formError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors">Скасувати</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">Створити</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

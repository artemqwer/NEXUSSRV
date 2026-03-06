"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, User, Terminal, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [login,    setLogin]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);

  // Перевірка — якщо вже залогований, редиректимо
  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => { if (d.user) router.replace("/"); })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !password) { setError("Заповни всі поля"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: login.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Невірний логін або пароль");
      } else {
        router.replace("/");
      }
    } catch {
      setError("Помилка з'єднання із сервером");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0a0e14" }}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ width: 500, height: 500, top: "-10%", left: "-10%", background: "radial-gradient(circle, #00e5ff, transparent)" }}
        />
        <div
          className="absolute rounded-full blur-3xl opacity-8"
          style={{ width: 400, height: 400, bottom: "-10%", right: "-5%", background: "radial-gradient(circle, #818cf8, transparent)", animationDuration: "4s" }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,229,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{
          background: "rgba(22,27,35,0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(0,229,255,0.12)",
          boxShadow: "0 0 80px rgba(0,229,255,0.06), 0 32px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(129,140,248,0.15))",
              border: "1px solid rgba(0,229,255,0.2)",
              boxShadow: "0 0 30px rgba(0,229,255,0.15)",
            }}
          >
            <Terminal size={24} color="#00e5ff" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-widest text-white">
              NEXUS<span style={{ color: "#00e5ff" }}>SRV</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">Адмін Панель · Debian Server</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Login */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Логін</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                id="login-input"
                value={login}
                onChange={e => { setLogin(e.target.value); setError(""); }}
                placeholder="your_login"
                autoComplete="username"
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-gray-200 outline-none transition-all placeholder-gray-700 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${error ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
                onFocus={e => { if (!error) (e.target as HTMLElement).parentElement!.querySelector("input")!.style.borderColor = "rgba(0,229,255,0.4)"; }}
                onBlur={e  => { if (!error) (e.target as HTMLElement).parentElement!.querySelector("input")!.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Пароль</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                id="password-input"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-gray-200 outline-none transition-all placeholder-gray-700 disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${error ? "rgba(248,113,113,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171" }}>
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !login || !password}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            style={{
              background: loading ? "rgba(0,229,255,0.05)" : "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(129,140,248,0.15))",
              color: "#00e5ff",
              border: "1px solid rgba(0,229,255,0.3)",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,229,255,0.1)",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Вхід...
              </>
            ) : (
              "Увійти в панель"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-700 mt-6">
          Приватна панель · Реєстрація закрита
        </p>
      </div>
    </div>
  );
}

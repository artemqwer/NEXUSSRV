"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wifi, WifiOff, RefreshCw, Terminal as TermIcon,
  Maximize2, Minimize2, Settings2, Zap,
} from "lucide-react";
import type { Terminal } from "@xterm/xterm";

// WebSocket-адреса аґента-терміналу.
// Аґент слухає тільки loopback, а в браузер його віддає `tailscale serve`
// з TLS — тому wss://, інакше HTTPS-сторінка заблокує ws://.
// Доступ перевіряється на сервері через Tailscale whois, токен не потрібен.
const DEFAULT_WS_URL = "wss://shadxwfxry-hub.taila5dca9.ts.net/terminal";
const LS_URL   = "terminalWsUrl";
const LS_AUTORE = "terminalAutoReconnect";

// Швидкі команди — вводяться прямо в PTY (код не виконує їх сам, їх бачить shell)
const QUICK_COMMANDS: { label: string; cmd: string }[] = [
  { label: "uptime",        cmd: "uptime\n" },
  { label: "docker ps",     cmd: "docker ps\n" },
  { label: "docker stats",  cmd: "docker stats --no-stream\n" },
  { label: "df -h",         cmd: "df -h\n" },
  { label: "free -h",       cmd: "free -h\n" },
  { label: "htop",          cmd: "htop\n" },
  { label: "journal err",   cmd: "journalctl -p 3 -n 30 --no-pager\n" },
  { label: "systemctl fail",cmd: "systemctl list-units --failed\n" },
];

type ConnState = "idle" | "connecting" | "connected" | "error";

function loadLs(key: string, fallback: string): string {
  try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function saveLs(key: string, value: string) {
  try { window.localStorage.setItem(key, value); } catch {}
}

export function TerminalSection() {
  const termDivRef  = useRef<HTMLDivElement>(null);
  const termRef     = useRef<Terminal | null>(null);
  const wsRef       = useRef<WebSocket | null>(null);
  const fitRef      = useRef<{ fit(): void } | null>(null);
  const roRef       = useRef<ResizeObserver | null>(null);
  const reconTimer  = useRef<number | null>(null);
  const userClosed  = useRef(false);
  // heartbeat: виявлення "піввідкритого" TCP (наприклад, після рестарту tailscaled)
  const hbTimer     = useRef<number | null>(null);
  const pongTimer   = useRef<number | null>(null);
  // актуальні connect/autoRe для колбеків без стаб-клозурів
  const connectRef  = useRef<(() => void) | null>(null);
  const autoReRef   = useRef(true);

  const [connState, setConnState] = useState<ConnState>("idle");
  const [wsUrl, setWsUrlState]    = useState<string>(() => loadLs(LS_URL, DEFAULT_WS_URL));
  const [autoRe, setAutoRe]       = useState<boolean>(() => loadLs(LS_AUTORE, "1") === "1");
  const [showSettings, setShowSettings] = useState(false);
  const [urlDraft, setUrlDraft]   = useState(wsUrl);
  const [isFull, setIsFull]       = useState(false);

  autoReRef.current = autoRe;
  const setWsUrl = (v: string) => { saveLs(LS_URL, v); setWsUrlState(v); };
  const toggleAutoRe = () => setAutoRe(v => { saveLs(LS_AUTORE, v ? "0" : "1"); return !v; });

  const cleanupTerminal = () => {
    roRef.current?.disconnect();
    roRef.current = null;
    termRef.current?.dispose();
    termRef.current = null;
    fitRef.current = null;
    if (termDivRef.current) termDivRef.current.innerHTML = "";
  };

  const disconnect = (auto = false) => {
    userClosed.current = !auto;
    stopHeartbeat();
    if (reconTimer.current !== null) {
      window.clearTimeout(reconTimer.current);
      reconTimer.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
    setConnState("idle");
  };

  const stopHeartbeat = () => {
    if (hbTimer.current !== null)   { window.clearInterval(hbTimer.current);   hbTimer.current = null; }
    if (pongTimer.current !== null) { window.clearTimeout(pongTimer.current);  pongTimer.current = null; }
  };

  // TCP може померти непомітно (сервістика tailscaled, зміна мережі) —
  // тоді браузерний WS висить у OPEN і onclose не приходить.
  // Лікуємо: періодичний app-level ping; немає pong за 8с — ріжаємо сокет і реконект.
  const startHeartbeat = () => {
    stopHeartbeat();
    hbTimer.current = window.setInterval(() => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      try { ws.send(JSON.stringify({ type: "ping" })); } catch {}
      if (pongTimer.current !== null) window.clearTimeout(pongTimer.current);
      pongTimer.current = window.setTimeout(() => {
        // мертвий сокет: примусово закриваємо — далі спрацює onclose/автоперепідключення
        try { ws.close(); } catch {}
      }, 8000);
    }, 15000);
  };

  // Ініціалізація xterm.js (контейнер завжди має ненульовий розмір —
  // додаток-плейсхолдер лежить поверх, а не замість нього)
  const initTerminal = async () => {
    if (!termDivRef.current) return null;

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon  } = await import("@xterm/addon-fit");
    const { WebLinksAddon } = await import("@xterm/addon-web-links");

    cleanupTerminal();

    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#0a0e14",
        foreground: "#e2e8f0",
        cursor:     "#00e5ff",
        cursorAccent: "#0a0e14",
        black:   "#1e2030",
        red:     "#f87171",
        green:   "#34d399",
        yellow:  "#fbbf24",
        blue:    "#60a5fa",
        magenta: "#c084fc",
        cyan:    "#00e5ff",
        white:   "#e2e8f0",
      },
      fontFamily: "'Courier New', Menlo, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      scrollback: 2000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    // даємо браузеру кадр, щоб контейнер уже мав розміри до open()
    // (race із таймаутом: у фоні requestAnimationFrame не тікає і реконект зависав би)
    await Promise.race([
      new Promise<void>((r) => requestAnimationFrame(() => r())),
      new Promise<void>((r) => setTimeout(r, 600)),
    ]);
    term.open(termDivRef.current);
    try { fit.fit(); } catch {}
    fitRef.current = fit;
    termRef.current = term;

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch {} });
    ro.observe(termDivRef.current);
    roRef.current = ro;

    term.onData((data: string) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    return term;
  };

  const connect = async () => {
    if (reconTimer.current !== null) {
      window.clearTimeout(reconTimer.current);
      reconTimer.current = null;
    }
    userClosed.current = false;
    wsRef.current?.close();
    wsRef.current = null;

    setConnState("connecting");
    const term = await initTerminal();
    if (!term) return;

    term.write("\r\n  \x1b[36mПідключення до \x1b[1m" + wsUrl + "\x1b[0m\r\n");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let opened = false;

    ws.onopen = () => {
      opened = true;
      setConnState("connected");
      term.write("\x1b[32m  ✓ З'єднання встановлено\x1b[0m\r\n");
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      startHeartbeat();
      term.focus();
    };

    ws.onmessage = (e) => {
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "pong") {
            if (pongTimer.current !== null) { window.clearTimeout(pongTimer.current); pongTimer.current = null; }
            return;
          }
          if (msg.type === "output") term.write(msg.data);
        } catch {
          term.write(e.data);
        }
      } else {
        e.data.arrayBuffer().then((buf: ArrayBuffer) => term.write(new Uint8Array(buf)));
      }
    };

    ws.onerror = () => {
      if (!opened) setConnState("error");
      term.write("\r\n\x1b[31m  ✗ Помилка підключення. Перевір, що terminal.py запущений на сервері.\x1b[0m\r\n");
    };

    ws.onclose = () => {
      stopHeartbeat();
      if (!opened) {
        setConnState("error");
        // сервер лежить — пробуємо далі, щоб авто відродилось коли стане докупи
        if (autoReRef.current && !userClosed.current) {
          reconTimer.current = window.setTimeout(() => { connectRef.current?.(); }, 3000);
        }
        return;
      }
      setConnState("idle");
      term.write("\r\n\x1b[33m  ⚠ З'єднання розірвано\x1b[0m\r\n");
      if (autoReRef.current && !userClosed.current) {
        reconTimer.current = window.setTimeout(() => { connectRef.current?.(); }, 3000);
      }
    };
  };

  // завжди актуальний connect для авто-реконнекту
  useEffect(() => { connectRef.current = connect; });

  const runQuick = (cmd: string) => {
    const ws = wsRef.current;
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "input", data: cmd }));
    termRef.current?.focus();
  };

  // cleanup при unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
      if (reconTimer.current !== null) window.clearTimeout(reconTimer.current);
      try { wsRef.current?.close(); } catch {}
      cleanupTerminal();
    };
  }, []);

  const stateLabel: Record<ConnState, { text: string; color: string }> = {
    idle:      { text: "Не підключено",  color: "#6b7280" },
    connecting:{ text: "Підключення...", color: "#fbbf24" },
    connected: { text: "Підключено",     color: "#34d399" },
    error:     { text: "Помилка",        color: "#f87171" },
  };
  const st = stateLabel[connState];
  const isActive = connState === "connected" || connState === "connecting";

  return (
    <div
      className="flex flex-col gap-3"
      style={isFull ? { position: "fixed", inset: "12px", zIndex: 60 } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Термінал</h1>
          <p className="text-xs text-gray-500 mt-0.5">Web-термінал сервера через tailnet</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFull(v => !v)}
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
            title={isFull ? "Згорнути" : "На весь екран"}
          >
            {isFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          <button
            onClick={() => { setShowSettings(v => !v); setUrlDraft(wsUrl); }}
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
            title="Налаштування з'єднання"
          >
            <Settings2 size={13} />
          </button>

          {/* Status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${st.color}15`, border: `1px solid ${st.color}30`, color: st.color }}>
            {connState === "connected" ? <Wifi size={11} /> : <WifiOff size={11} />}
            {st.text}
          </div>

          {connState === "connected" ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              Відключитись
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connState === "connecting"}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
            >
              {connState === "connecting" ? <RefreshCw size={11} className="animate-spin" /> : <TermIcon size={11} />}
              {connState === "connecting" ? "Підключення..." : "Підключитись"}
            </button>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="rounded-xl p-4 flex flex-col gap-3 shrink-0" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <label className="text-xs text-gray-400 flex flex-col gap-1.5">
            WebSocket-адреса аґента
            <input
              type="text"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder={DEFAULT_WS_URL}
              className="rounded-lg px-3 py-2 text-xs font-mono text-white outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setWsUrl(urlDraft.trim() || DEFAULT_WS_URL);
                setShowSettings(false);
                if (connState === "connected" || connState === "connecting") disconnect();
                connect();
              }}
              className="text-xs px-3 py-2 rounded-lg font-medium"
              style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
            >
              Зберегти і підключитись
            </button>
            <button
              onClick={toggleAutoRe}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              style={{
                background: autoRe ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.03)",
                color: autoRe ? "#34d399" : "#9ca3af",
                border: `1px solid ${autoRe ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
              }}
              title="Автоматично перепідключатись, якщо з'єднання обірвалось"
            >
              <Zap size={11} />
              Автоперепідключення: {autoRe ? "увімк" : "вимк"}
            </button>
          </div>
        </div>
      )}

      {/* Quick commands */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {QUICK_COMMANDS.map((q) => (
          <button
            key={q.label}
            onClick={() => runQuick(q.cmd)}
            disabled={connState !== "connected"}
            className="text-[11px] px-2.5 py-1 rounded-md font-mono transition-all disabled:opacity-30 hover:opacity-100"
            style={{ background: "rgba(255,255,255,0.04)", color: "#9fb3c8", border: "1px solid var(--border)" }}
            title={`Виконати в терміналі: ${q.cmd.trim()}`}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* xterm.js container */}
      <div
        className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden"
        style={{ background: "#0a0e14", border: "1px solid rgba(0,229,255,0.12)", boxShadow: "0 0 40px rgba(0,229,255,0.04)" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
          <span className="ml-3 text-[11px] text-gray-600 font-mono truncate">
            {connState === "connected" ? wsUrl : "shadxwfxry-hub — не підключено"}
          </span>
        </div>

        {/* xterm target — завжди з розміром, щоб open()/fit() не падали в 0×0 */}
        <div
          ref={termDivRef}
          className="w-full"
          style={{ height: "calc(100% - 40px)", overflow: "hidden" }}
        />

        {/* Idle / error overlay */}
        {!isActive && (
          <div className="absolute inset-x-0 bottom-0 top-[40px] flex flex-col items-center justify-center gap-3 text-gray-500"
            style={{ background: "rgba(10,14,20,0.88)" }}>
            <TermIcon size={32} className="opacity-20" />
            <p className="text-sm">
              {connState === "error"
                ? "Не вдалося підключитись — перевір агент і з'єднання"
                : "Натисни «Підключитись» щоб відкрити сесію на сервері"}
            </p>
            {connState === "error" && (
              <button
                onClick={connect}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
              >
                Спробувати знову
              </button>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <p className="text-[11px] text-gray-600 shrink-0">
        Сесію відкриває <code className="font-mono text-gray-500">agent/terminal.py</code> на сервері (слухає лише loopback,
        у браузер віддається через <code className="font-mono text-gray-500">tailscale serve</code>). Доступ — лише tailnet-акаунти з allowlist.
      </p>
    </div>
  );
}

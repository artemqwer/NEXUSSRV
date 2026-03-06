"use client";

import { useEffect, useRef, useState } from "react";
import { Wifi, WifiOff, RefreshCw, Terminal as TermIcon } from "lucide-react";

// WebSocket URL для підключення до SSH-сервера на телефоні.
// Бекенд друга повинен піднімати WS-сервер (наприклад, через node-pty + ws)
// на тому ж порту або окремому.
const getWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (!base) return null;
  // Перетворюємо http://... → ws://...
  return base.replace(/^http/, "ws").replace(/\/api$/, "") + "/terminal";
};

type ConnState = "idle" | "connecting" | "connected" | "error" | "no-config";

export function TerminalSection() {
  const termDivRef  = useRef<HTMLDivElement>(null);
  const termRef     = useRef<ReturnType<typeof import("@xterm/xterm")["Terminal"]["prototype"]["constructor"]> | null>(null);
  const wsRef       = useRef<WebSocket | null>(null);
  const fitRef      = useRef<{ fit(): void } | null>(null);
  const [connState, setConnState] = useState<ConnState>("idle");
  const [wsUrl,     setWsUrl]     = useState<string | null>(null);

  // Визначаємо URL при ініціалізації
  useEffect(() => {
    const url = getWsUrl();
    setWsUrl(url);
    if (!url) setConnState("no-config");
  }, []);

  // Ініціалізація xterm.js
  const initTerminal = async () => {
    if (!termDivRef.current) return;

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon  } = await import("@xterm/addon-fit");
    const { WebLinksAddon } = await import("@xterm/addon-web-links");

    // Очищуємо попередній інстанс якщо є
    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }
    termDivRef.current.innerHTML = "";

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

    term.open(termDivRef.current);
    fit.fit();
    fitRef.current = fit;
    termRef.current = term;

    // Resize observer
    const ro = new ResizeObserver(() => fit.fit());
    ro.observe(termDivRef.current);

    return term;
  };

  const connect = async () => {
    if (!wsUrl) { setConnState("no-config"); return; }

    setConnState("connecting");
    const term = await initTerminal();
    if (!term) return;

    term.writeln("\r\n  \x1b[36mПідключення до \x1b[1m" + wsUrl + "\x1b[0m\r\n");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    let opened = false;

    ws.onopen = () => {
      opened = true;
      setConnState("connected");
      term.writeln("\x1b[32m  ✓ З'єднання встановлено\x1b[0m\r\n");
      // Передаємо розмір терміналу на сервер
      ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (e) => {
      if (typeof e.data === "string") {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "output") term.write(msg.data);
        } catch {
          term.write(e.data);
        }
      } else {
        // Binary — пишемо напряму
        e.data.arrayBuffer().then((buf: ArrayBuffer) => term.write(new Uint8Array(buf)));
      }
    };

    ws.onerror = () => {
      setConnState("error");
      term.writeln("\r\n\x1b[31m  ✗ Помилка підключення. Перевір що бекенд запущений.\x1b[0m\r\n");
    };

    ws.onclose = () => {
      if (opened) {
        setConnState("idle");
        term.writeln("\r\n\x1b[33m  ⚠ З'єднання розірвано\x1b[0m\r\n");
      }
    };

    // Клавішне введення → WebSocket
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // При зміні розміру
    term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });
  };

  const disconnect = () => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnState("idle");
  };

  // Cleanup при unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      termRef.current?.dispose();
    };
  }, []);

  const stateLabel: Record<ConnState, { text: string; color: string }> = {
    idle:      { text: "Не підключено",   color: "#6b7280" },
    connecting:{ text: "Підключення...",  color: "#fbbf24" },
    connected: { text: "Підключено",      color: "#34d399" },
    error:     { text: "Помилка",         color: "#f87171" },
    "no-config":{ text: "URL не налаштовано", color: "#f87171" },
  };
  const st = stateLabel[connState];

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Термінал</h1>
          <p className="text-xs text-gray-500 mt-0.5">SSH-з'єднання з Debian-сервером (телефон)</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: `${st.color}15`, border: `1px solid ${st.color}30`, color: st.color }}>
            {connState === "connected" ? <Wifi size={11} /> : <WifiOff size={11} />}
            {st.text}
          </div>

          {connState === "connected" ? (
            <button
              onClick={disconnect}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}
            >
              Відключитись
            </button>
          ) : (
            <button
              onClick={connect}
              disabled={connState === "connecting" || connState === "no-config"}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--cyan-dim)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
            >
              {connState === "connecting" ? <RefreshCw size={11} className="animate-spin" /> : <TermIcon size={11} />}
              {connState === "connecting" ? "Підключення..." : "Підключитись"}
            </button>
          )}
        </div>
      </div>

      {/* Info banner if no URL */}
      {connState === "no-config" && (
        <div className="shrink-0 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24" }}>
          <strong>Налаштуй URL бекенду</strong> у розділі ⚙️ Налаштування → поле URL бекенду.
          <br />
          <span className="text-xs opacity-70">
            Бекенд повинен відкрити WebSocket endpoint <code className="font-mono">/terminal</code> (наприклад через <code>node-pty</code> + <code>ws</code>).
          </span>
        </div>
      )}

      {/* xterm.js container */}
      <div
        className="flex-1 rounded-xl overflow-hidden"
        style={{ background: "#0a0e14", border: "1px solid rgba(0,229,255,0.12)", boxShadow: "0 0 40px rgba(0,229,255,0.04)" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "#0d1117", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
          <span className="w-3 h-3 rounded-full bg-green-400/70" />
          <span className="ml-3 text-[11px] text-gray-600 font-mono">
            {connState === "connected" ? (wsUrl ?? "ssh") : "admin@debian-phone — не підключено"}
          </span>
        </div>

        {/* Idle placeholder */}
        {connState !== "connected" && connState !== "connecting" && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-600">
            <TermIcon size={32} className="opacity-20" />
            <p className="text-sm">Натисни «Підключитись» щоб відкрити SSH-сесію</p>
          </div>
        )}

        {/* xterm target */}
        <div
          ref={termDivRef}
          className="w-full"
          style={{
            height: connState === "connected" || connState === "connecting" ? "calc(100% - 40px)" : "0px",
            overflow: "hidden",
          }}
        />
      </div>

      {/* Note */}
      <p className="text-[11px] text-gray-600 shrink-0">
        Потрібен WS-сервер на боці Debian: <code className="font-mono text-gray-500">npm install -g ttyd</code> або <code className="font-mono text-gray-500">node-pty + ws</code> — твій друг налаштовує це на телефоні.
      </p>
    </div>
  );
}

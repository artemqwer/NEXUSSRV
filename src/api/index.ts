/**
 * Це базовий модуль для підключення бекенду сервера.
 * Поки сервер не готовий, ми віддаємо фейкові дані (MOCK).
 * Коли друг доробить сервер — просто зміни USE_MOCK на false 
 * та вкажи реальний API_BASE_URL (наприклад, http://його_айпі:8080/api).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
const API_KEY      = process.env.NEXT_PUBLIC_API_KEY || "";
const USE_MOCK = false; 

export interface ServerStats {
  cpu: { usage: number; temp: number | null; cores: number };
  ram: { total: number; used: number; percent: number };
  battery: { level: number | null; isCharging: boolean | null };
  storage: {
    total: number;
    used: number;
    percent: number;
    disks?: {
      mount: string;
      fs: string;
      size: number;
      used: number;
      use: number;
    }[];
  };
  uptime: string;
  network: {
    ping: number | null;
    interfaces?: {
      name: string;
      ip: string;
      mac: string;
      status: string;
      speed: number;
      rx: number;
      tx: number;
      rxRate: number;
      txRate: number;
    }[];
  };
}

export interface Player {
  id: number;
  name: string;
  role: string;
  status: "online" | "offline";
}

export const api = {
  // === Отримання статистики ===
  getStats: async (): Promise<ServerStats | null> => {
    if (USE_MOCK) {
      return {
        cpu: { usage: 45, temp: 50, cores: 8 },
        ram: { total: 6000, used: 3000, percent: 50 },
        battery: { level: 70, isCharging: true },
        storage: { total: 128, used: 45, percent: 35 },
        uptime: "14D 05H",
        network: { ping: 42 },
      };
    }

    try {
      const headers: Record<string, string> = {};
      if (API_KEY) headers["Authorization"] = `Bearer ${API_KEY}`;
      
      const res = await fetch(`${API_BASE_URL}/stats`, { headers });
      if (!res.ok) throw new Error("Сервер недоступний");
      return res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  // === Отримання списку гравців ===
  getPlayers: async (): Promise<Player[]> => {
    if (USE_MOCK) {
      return [
        { id: 1, name: "Admin_Pro", role: "Owner", status: "online" },
        { id: 2, name: "Killer777", role: "Elite", status: "online" },
        { id: 3, name: "Noob_Master", role: "User", status: "offline" },
        { id: 4, name: "Viking2000", role: "VIP", status: "online" },
        { id: 5, name: "Shadow", role: "Moderator", status: "offline" },
      ];
    }

    try {
      const res = await fetch(`${API_BASE_URL}/players`);
      if (!res.ok) throw new Error("Сервер недоступний");
      return res.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};

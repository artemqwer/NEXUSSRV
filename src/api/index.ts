/**
 * Це базовий модуль для підключення бекенду сервера.
 * Поки сервер не готовий, ми віддаємо фейкові дані (MOCK).
 * Коли друг доробить сервер — просто зміни USE_MOCK на false 
 * та вкажи реальний API_BASE_URL (наприклад, http://його_айпі:8080/api).
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const USE_MOCK = true; // Зміни на false, щоб піти на реальний сервер

export interface ServerStats {
  users: number;
  online: number;
  serverLoad: string;
  uptime: string;
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
        users: 1543,
        online: 236,
        serverLoad: "64%",
        uptime: "14D 05H",
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
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

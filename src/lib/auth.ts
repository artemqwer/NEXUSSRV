/**
 * Проста клієнтська авторизація для приватної панелі.
 * Облікові дані задаються через env-змінні у .env.local
 * або залишаються як захардкоджені дефолти.
 * 
 * Для Vercel — додай ці змінні у Settings → Environment Variables.
 */

// Два дозволені користувачі
// (замінюй паролі через .env.local або Vercel ENV)
const USERS: Record<string, string> = {
  [process.env.NEXT_PUBLIC_USER1_LOGIN || "admin"]:   process.env.NEXT_PUBLIC_USER1_PASS || "nexus2024",
  [process.env.NEXT_PUBLIC_USER2_LOGIN || "artem"]:   process.env.NEXT_PUBLIC_USER2_PASS || "srv2024",
};

const SESSION_KEY = "nexussrv_session";
const SESSION_VALUE = "authenticated_v1";

export const auth = {
  /** Перевірити логін+пароль, зберегти сесію */
  login(login: string, password: string): boolean {
    const expected = USERS[login.trim()];
    if (expected && expected === password) {
      localStorage.setItem(SESSION_KEY, `${SESSION_VALUE}:${login.trim()}`);
      return true;
    }
    return false;
  },

  /** Перевірити чи є активна сесія */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    const val = localStorage.getItem(SESSION_KEY);
    return !!val?.startsWith(SESSION_VALUE);
  },

  /** Отримати поточного юзера */
  getUser(): string {
    if (typeof window === "undefined") return "";
    const val = localStorage.getItem(SESSION_KEY) ?? "";
    return val.split(":")[1] ?? "";
  },

  /** Вийти */
  logout() {
    localStorage.removeItem(SESSION_KEY);
  },
};

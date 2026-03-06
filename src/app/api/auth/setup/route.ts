import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * GET /api/auth/setup
 * Одноразовий endpoint для:
 *  1. Створення таблиці users (якщо не існує)
 *  2. Додавання дефолтних 2 юзерів
 * 
 * УВАГА: після першого запуску вимкни або видали цей endpoint!
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");

  // Проста захисна перевірка
  if (secret !== (process.env.SETUP_SECRET || "setup123")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();

  const sql = getDb();

  const users = [
    { login: "admin",  password: "nexus2024", displayName: "Admin",  role: "owner" },
    { login: "artem",  password: "srv2024",   displayName: "Artem",  role: "admin" },
  ];

  const results = [];
  for (const u of users) {
    const exists = await sql`SELECT 1 FROM users WHERE login = ${u.login} LIMIT 1`;
    if (exists.length === 0) {
      const hash = await bcrypt.hash(u.password, 12);
      await sql`
        INSERT INTO users (login, password_hash, display_name, role)
        VALUES (${u.login}, ${hash}, ${u.displayName}, ${u.role})
      `;
      results.push({ login: u.login, created: true });
    } else {
      results.push({ login: u.login, created: false, note: "вже існує" });
    }
  }

  return NextResponse.json({ ok: true, results });
}

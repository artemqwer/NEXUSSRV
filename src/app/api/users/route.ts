import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, login, display_name, role, last_login, created_at
      FROM users
      ORDER BY id ASC
    `;

    // Адаптуємо під інтерфейс фронтенду
    const users = rows.map(r => ({
      id: r.id,
      name: r.display_name || r.login,
      email: r.login,
      role: r.role,
      status: "offline", // поки що статика
      lastSeen: r.last_login ? new Date(r.last_login).toLocaleString("uk-UA") : "Ніколи",
      ip: "127.0.0.1",
    }));

    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password, displayName, role } = body;

    if (!login || !password) {
      return NextResponse.json({ error: "Потрібен логін та пароль" }, { status: 400 });
    }

    const sql = getDb();

    // Перевіряємо чи є такий
    const exists = await sql`SELECT 1 FROM users WHERE login = ${login} LIMIT 1`;
    if (exists.length > 0) {
      return NextResponse.json({ error: "Користувач вже існує" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);
    
    // Вставляємо
    const res = await sql`
      INSERT INTO users (login, password_hash, display_name, role)
      VALUES (${login}, ${hash}, ${displayName || login}, ${role || "player"})
      RETURNING id, login, display_name, role, created_at
    `;

    const newUser = res[0];
    return NextResponse.json({
      id: newUser.id,
      name: newUser.display_name,
      email: newUser.login,
      role: newUser.role,
      status: "offline",
      lastSeen: "Щойно створено",
      ip: "127.0.0.1",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}

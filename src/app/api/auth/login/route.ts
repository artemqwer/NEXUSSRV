import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { login, password } = await req.json();

    if (!login || !password) {
      return NextResponse.json({ error: "Введи логін та пароль" }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT id, login, password_hash, display_name, role
      FROM users
      WHERE login = ${login.trim()}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password_hash as string);
    if (!match) {
      return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
    }

    // Оновлюємо last_login
    await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

    // Підписуємо JWT
    const token = await signToken({
      sub:         user.login as string,
      displayName: (user.display_name as string) || (user.login as string),
      role:        user.role as string,
    });

    const res = NextResponse.json({ ok: true, user: { login: user.login, displayName: user.display_name, role: user.role } });

    // Зберігаємо в httpOnly cookie (7 днів)
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    });

    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}

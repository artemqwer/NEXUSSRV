import { neon } from "@neondatabase/serverless";

// Підключення до Neon PostgreSQL
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не вказано у .env.local");
  return neon(url);
}

/**
 * Ініціалізація таблиці users.
 * Запускається один раз при першому виклику /api/auth/setup
 */
export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      login        VARCHAR(50)  UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(100),
      role         VARCHAR(20)  NOT NULL DEFAULT 'admin',
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      last_login   TIMESTAMPTZ
    )
  `;
}

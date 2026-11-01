import { NextResponse } from "next/server";

export async function GET() {
  const sql = getDb();
  const rows = await sql`
    SELECT data, updated_at FROM stats WHERE id = 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "no data yet" }, { status: 404 });
  }
  return NextResponse.json({
    ...rows[0].data,
    updated_at: rows[0].updated_at,
  });
}


import { getDb, initStatsTable } from "@/lib/db";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.AGENT_TOKEN}`;
  if (!process.env.AGENT_TOKEN || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  await initStatsTable();
  const sql = getDb();
  await sql`
    INSERT INTO stats (id, data, updated_at)
    VALUES (1, ${JSON.stringify(data)}, NOW())
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export async function GET() {
  try {
    await initDb();
    const db = getDb();
    const corrections = await db.execute("SELECT * FROM corrections ORDER BY created_at DESC LIMIT 100");
    const comments = await db.execute("SELECT * FROM comments ORDER BY created_at DESC LIMIT 100");
    return NextResponse.json({ ok: true, corrections: corrections.rows, comments: comments.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const b = await req.json();
    if (!b.text) return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });
    await db.execute({
      sql: "INSERT INTO comments (store_id, item_id, text, tag) VALUES (?,?,?,?)",
      args: [b.store_id || null, b.item_id || null, b.text, b.tag || "info"],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

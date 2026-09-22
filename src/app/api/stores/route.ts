import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

export async function GET(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const city = sp.get("city") || "";
    const sql = "SELECT * FROM stores ORDER BY name";
    let rows;
    if (city && city !== "All") {
      rows = await db.execute({ sql: "SELECT * FROM stores WHERE city=? ORDER BY name", args: [city] });
    } else {
      rows = await db.execute(sql);
    }
    return NextResponse.json({ ok: true, stores: rows.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;
    await initDb();
    const db = getDb();
    const b = await req.json();
    if (!b.name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
    await db.execute({
      sql: "INSERT INTO stores (name, city, address, lat, lng, phone, is_online, image_url) VALUES (?,?,?,?,?,?,?,?)",
      args: [b.name, b.city || "", b.address || "", Number(b.lat) || 0, Number(b.lng) || 0, b.phone || "", b.is_online ? 1 : 0, b.image_url || ""],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

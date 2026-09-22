import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { requireUser } from "@/lib/require-user";

// POST /api/prices {item_id, store_id, price, unit, quality, stock_level, is_online, comment}
// Preference rule: scraped rows win over manual. If a scraped price for same
// item+store was updated in last 7 days, manual submissions go to `corrections`
// table as pending instead of overwriting. Otherwise manual updates the price row.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;
    await initDb();
    const db = getDb();
    const b = await req.json();
    const { item_id, store_id, price, unit = "kg", quality = 3, stock_level = "in_stock", is_online = 0, comment = "" } = b;
    if (!item_id || !store_id || !isFinite(Number(price))) {
      return NextResponse.json({ ok: false, error: "item_id, store_id, price required" }, { status: 400 });
    }
    const existing = await db.execute({
      sql: "SELECT * FROM prices WHERE item_id=? AND store_id=? AND is_online=? LIMIT 1",
      args: [Number(item_id), Number(store_id), Number(is_online) ? 1 : 0],
    });
    const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
    if (row && String(row.source) === "scraped") {
      const updated = new Date(String(row.updated_at));
      const ageDays = (Date.now() - updated.getTime()) / 86400000;
      if (ageDays < 7) {
        await db.execute({
          sql: "INSERT INTO corrections (price_id, item_id, store_id, old_price, new_price, comment, status, author_name, author_image) VALUES (?,?,?,?,?,?,?,?,?)",
          args: [Number(row.id), Number(item_id), Number(store_id), Number(row.price), Number(price), comment || "manual correction vs fresh scrape", "pending", auth.user.name, auth.user.image],
        });
        return NextResponse.json({ ok: true, queued: true, message: "Fresh scraped price exists — your correction is queued for review." });
      }
    }
    const signedNote = `${comment || ""} · by ${auth.user.name}`.slice(0, 400);
    if (row) {
      await db.execute({
        sql: "UPDATE prices SET price=?, unit=?, quality=?, stock_level=?, updated_at=datetime('now'), source='manual', note=? WHERE id=?",
        args: [Number(price), unit, Number(quality), stock_level, signedNote, Number(row.id)],
      });
    } else {
      await db.execute({
        sql: "INSERT INTO prices (item_id, store_id, price, unit, quality, stock_level, is_online, source, note) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [Number(item_id), Number(store_id), Number(price), unit, Number(quality), stock_level, Number(is_online) ? 1 : 0, "manual", signedNote],
      });
    }
    return NextResponse.json({ ok: true, queued: false });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const item_id = sp.get("item_id");
    const store_id = sp.get("store_id");
    let sql = "SELECT p.*, s.name as store_name, i.name_en FROM prices p JOIN stores s ON s.id=p.store_id JOIN items i ON i.id=p.item_id WHERE 1=1";
    const args: (string | number)[] = [];
    if (item_id) { sql += " AND p.item_id=?"; args.push(Number(item_id)); }
    if (store_id) { sql += " AND p.store_id=?"; args.push(Number(store_id)); }
    sql += " ORDER BY p.updated_at DESC LIMIT 200";
    const rows = await db.execute({ sql, args });
    return NextResponse.json({ ok: true, prices: rows.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

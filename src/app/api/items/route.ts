import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { haversineKm } from "@/lib/geo";
import { pricePerKg } from "@/lib/units";

// GET /api/items?q=&city=&lat=&lng=&radiusKm=&unit=kg&sort=price&online=include|only|exclude
export async function GET(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") || "").trim().toLowerCase();
    const city = (sp.get("city") || "").trim();
    const lat = parseFloat(sp.get("lat") || "");
    const lng = parseFloat(sp.get("lng") || "");
    const radiusKm = parseFloat(sp.get("radiusKm") || "25");
    const displayUnit = sp.get("unit") || "kg";
    const online = sp.get("online") || "include"; // include|only|exclude

    const itemsRes = await db.execute("SELECT * FROM items ORDER BY name_en");
    const items = itemsRes.rows as unknown as Record<string, unknown>[];
    const filtered = items.filter((it) => {
      if (!q) return true;
      const hay = `${it.name_en} ${it.name_bn} ${it.name_alt} ${it.category}`.toLowerCase();
      return q.split(/\s+/).every((tok) => hay.includes(tok));
    });

    const pricesRes = await db.execute(
      `SELECT p.*, s.name as store_name, s.city as store_city, s.lat as store_lat, s.lng as store_lng, s.is_online as store_online, i.name_en as item_name_en
       FROM prices p JOIN stores s ON s.id=p.store_id JOIN items i ON i.id=p.item_id`
    );
    const prices = pricesRes.rows as unknown as Record<string, unknown>[];

    const out = filtered.map((it) => {
      const itemId = Number(it.id);
      let opts = prices.filter((p) => Number(p.item_id) === itemId);
      if (city && city !== "All" && city !== "Online") {
        opts = opts.filter((p) => String(p.store_city) === city);
      }
      if (online === "only") opts = opts.filter((p) => Number(p.is_online) === 1 || Number(p.store_online) === 1);
      if (online === "exclude") opts = opts.filter((p) => Number(p.is_online) === 0 && Number(p.store_online) === 0);

      const enriched = opts.map((p) => {
        const slat = Number(p.store_lat);
        const slng = Number(p.store_lng);
        const distKm =
          isFinite(lat) && isFinite(lng) && slat !== 0
            ? haversineKm(lat, lng, slat, slng)
            : NaN;
        const ppk = pricePerKg(Number(p.price), String(p.unit));
        // scraped preferred: boost rank
        const sourceBoost = String(p.source) === "scraped" ? -0.05 : 0;
        return { ...p, distanceKm: distKm, pricePerKg: ppk, _boost: sourceBoost };
      }).filter((p) => {
        if (isFinite(lat) && isFinite(lng) && isFinite(radiusKm) && isFinite(Number((p as Record<string, unknown>).distanceKm))) {
          // online stores (0,0) always pass
          if (Number((p as Record<string, unknown>).store_lat) === 0) return true;
          return Number((p as Record<string, unknown>).distanceKm) <= radiusKm;
        }
        return true;
      });

      enriched.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const bad = (s: unknown) => (s === "out_of_stock" || s === "bad_product" ? 1 : 0);
        const bs = bad(a.stock_level) - bad(b.stock_level);
        if (bs !== 0) return bs;
        const pa = Number(a.pricePerKg);
        const pb = Number(b.pricePerKg);
        if (isFinite(pa) && isFinite(pb)) return pa + Number(a._boost) - (pb + Number(b._boost));
        if (isFinite(Number(a.price)) && isFinite(Number(b.price)) && String(a.unit) === "piece")
          return Number(a.price) - Number(b.price);
        return Number(a.price) - Number(b.price);
      });

      return { item: it, options: enriched, displayUnit };
    });

    return NextResponse.json({ ok: true, count: out.length, results: out });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const body = await req.json();
    const { name_en, name_bn = "", name_alt = "", category = "grocery", image_url = "", base_unit = "kg" } = body;
    if (!name_en) return NextResponse.json({ ok: false, error: "name_en required" }, { status: 400 });
    await db.execute({
      sql: "INSERT INTO items (name_en, name_bn, name_alt, category, image_url, base_unit) VALUES (?,?,?,?,?,?)",
      args: [name_en, name_bn, name_alt, category, image_url, base_unit],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

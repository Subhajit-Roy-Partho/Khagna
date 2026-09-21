import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { SEED_STORES, SEED_ITEMS, SEED_CARDS, SEED_BENEFITS } from "@/lib/seed-data";

export async function POST() {
  try {
    await initDb();
    const db = getDb();
    const { rows: sCount } = await db.execute("SELECT COUNT(*) as c FROM stores");
    const storeEmpty = Number((sCount[0] as unknown as { c: number }).c) === 0;
    if (storeEmpty) {
      for (const s of SEED_STORES) {
        await db.execute({
          sql: "INSERT INTO stores (name, city, address, lat, lng, phone, is_online, image_url) VALUES (?,?,?,?,?,?,?,?)",
          args: [s.name, s.city, s.address, s.lat, s.lng, s.phone, s.is_online, s.image_url],
        });
      }
      for (const it of SEED_ITEMS) {
        await db.execute({
          sql: "INSERT INTO items (name_en, name_bn, name_alt, category, image_url, base_unit) VALUES (?,?,?,?,?,?)",
          args: [it.name_en, it.name_bn, it.name_alt, it.category, it.image_url, it.base_unit],
        });
      }
      // sample prices: item i at store j
      const stores = (await db.execute("SELECT id, is_online FROM stores")).rows as unknown as { id: number; is_online: number }[];
      const items = (await db.execute("SELECT id, base_unit FROM items")).rows as unknown as { id: number; base_unit: string }[];
      const samplePrice = [3.2, 4.1, 2.9, 5.5];
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < stores.length; j++) {
          const jitter = ((i * 7 + j * 13) % 10) / 10; // deterministic 0..0.9
          const price = +(samplePrice[j % samplePrice.length] + jitter + i * 0.8).toFixed(2);
          await db.execute({
            sql: "INSERT INTO prices (item_id, store_id, price, unit, quality, stock_level, is_online, source) VALUES (?,?,?,?,?,?,?,?)",
            args: [
              items[i].id,
              stores[j].id,
              price,
              items[i].base_unit === "piece" ? "piece" : j % 2 === 0 ? "kg" : "lb",
              3 + ((i + j) % 3),
              (i + j) % 5 === 0 ? "low_stock" : "in_stock",
              stores[j].is_online,
              "manual",
            ],
          });
        }
      }
      for (const c of SEED_CARDS) {
        await db.execute({
          sql: "INSERT INTO cards (name, bank, image_url, annual_fee, rating, apply_url) VALUES (?,?,?,?,?,?)",
          args: [c.name, c.bank, c.image_url, c.annual_fee, c.rating, c.apply_url],
        });
      }
      const cards = (await db.execute("SELECT id FROM cards ORDER BY id")).rows as unknown as { id: number }[];
      for (const b of SEED_BENEFITS) {
        const card_id = cards[b.card]?.id;
        if (!card_id) continue;
        await db.execute({
          sql: "INSERT INTO card_benefits (card_id, category, merchant_place, reward_rate, reward_type, cap, description) VALUES (?,?,?,?,?,?,?)",
          args: [card_id, b.category, b.merchant_place, b.reward_rate, b.reward_type, b.cap, b.description],
        });
      }
    }
    return NextResponse.json({ ok: true, seeded: storeEmpty });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}

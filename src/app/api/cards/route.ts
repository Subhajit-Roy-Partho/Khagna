import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

// GET /api/cards?category=&place=&q=
export async function GET(req: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const sp = req.nextUrl.searchParams;
    const category = (sp.get("category") || "").toLowerCase();
    const place = (sp.get("place") || "").toLowerCase();
    const q = (sp.get("q") || "").toLowerCase();

    const cards = (await db.execute("SELECT * FROM cards ORDER BY rating DESC")).rows as unknown as Record<string, unknown>[];
    const benefits = (await db.execute(
      "SELECT b.*, c.name as card_name, c.bank FROM card_benefits b JOIN cards c ON c.id=b.card_id"
    )).rows as unknown as Record<string, unknown>[];

    const scored = cards.map((c) => {
      const cid = Number(c.id);
      let rel = benefits.filter((b) => Number(b.card_id) === cid);
      if (q) {
        rel = rel.filter((b) =>
          `${b.category} ${b.merchant_place} ${b.description} ${b.card_name} ${b.bank}`.toLowerCase().includes(q)
        );
      }
      let match = rel;
      if (category) match = match.filter((b) => String(b.category).toLowerCase().includes(category));
      if (place) match = match.filter((b) => String(b.merchant_place).toLowerCase().includes(place) || String(b.merchant_place).toLowerCase() === "any");
      const bestRate = match.reduce((m, b) => Math.max(m, Number(b.reward_rate) || 0), 0);
      // score = best matching rate*10 + rating - annual_fee/1000
      const score = (match.length ? bestRate * 10 : -100) + Number(c.rating || 0) - Number(c.annual_fee || 0) / 1000;
      return { card: c, benefits: rel, matched: match, bestRate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return NextResponse.json({ ok: true, results: scored });
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
    if (!b.name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
    const r = await db.execute({
      sql: "INSERT INTO cards (name, bank, image_url, annual_fee, rating, apply_url) VALUES (?,?,?,?,?,?)",
      args: [b.name, b.bank || "", b.image_url || "", Number(b.annual_fee) || 0, Number(b.rating) || 0, b.apply_url || ""],
    });
    const cardId = Number(r.lastInsertRowid);
    for (const ben of b.benefits || []) {
      await db.execute({
        sql: "INSERT INTO card_benefits (card_id, category, merchant_place, reward_rate, reward_type, cap, description) VALUES (?,?,?,?,?,?,?)",
        args: [cardId, ben.category || "grocery", ben.merchant_place || "any", Number(ben.reward_rate) || 0, ben.reward_type || "cashback", ben.cap || "", ben.description || ""],
      });
    }
    return NextResponse.json({ ok: true, id: cardId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

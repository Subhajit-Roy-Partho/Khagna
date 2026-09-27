import { getDb, initDb } from "./db";
import { USA_CARDS } from "./usa-cards";

export type SeedResult = {
  cardsAdded: number;
  cardsKept: number;
  bensAdded: number;
  bensKept: number;
};

// Idempotent upsert of the curated USA catalog. Matches cards by
// (name, bank); adds only missing benefits; backfills blank bank_website.
export async function seedUsaCards(): Promise<SeedResult> {
  await initDb();
  const db = getDb();
  let cardsAdded = 0;
  let cardsKept = 0;
  let bensAdded = 0;
  let bensKept = 0;
  for (const c of USA_CARDS) {
    const ex = (
      await db.execute({ sql: "SELECT id, bank_website FROM cards WHERE name=? AND bank=? LIMIT 1", args: [c.name, c.bank] })
    ).rows[0] as unknown as { id: number; bank_website: string } | undefined;
    let id: number;
    if (ex) {
      id = Number(ex.id);
      cardsKept++;
      if (!ex.bank_website && c.bank_website) {
        await db.execute({ sql: "UPDATE cards SET bank_website=? WHERE id=?", args: [c.bank_website, id] });
      }
    } else {
      const r = await db.execute({
        sql: "INSERT INTO cards (name, bank, image_url, annual_fee, rating, apply_url, customer_care, fraud_number, bank_website) VALUES (?,?,?,?,?,?,?,?,?)",
        args: [c.name, c.bank, c.image_url, c.annual_fee, c.rating, c.apply_url, "", "", c.bank_website],
      });
      id = Number(r.lastInsertRowid);
      cardsAdded++;
    }
    for (const b of c.benefits) {
      const bex = (
        await db.execute({
          sql: "SELECT id FROM card_benefits WHERE card_id=? AND category=? AND merchant_place=? AND reward_rate=? AND reward_type=? LIMIT 1",
          args: [id, b.category, b.merchant_place, b.reward_rate, b.reward_type],
        })
      ).rows[0];
      if (bex) {
        bensKept++;
        continue;
      }
      await db.execute({
        sql: "INSERT INTO card_benefits (card_id, category, merchant_place, reward_rate, reward_type, cap, description) VALUES (?,?,?,?,?,?,?)",
        args: [id, b.category, b.merchant_place, b.reward_rate, b.reward_type, b.cap, b.description],
      });
      bensAdded++;
    }
  }
  return { cardsAdded, cardsKept, bensAdded, bensKept };
}

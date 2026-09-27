/**
 * Seed the curated USA credit-card catalog (src/lib/usa-cards.ts) into Turso.
 *
 * Idempotent upsert: matches cards by (name, bank), adds only missing
 * benefits (matched by category + merchant_place + rate + type). Safe to
 * re-run after refreshing the catalog. Never deletes or fakes anything.
 *
 * Usage:
 *   npm run seed:usa-cards -- --dry-run   # print what would change, write nothing
 *   npm run seed:usa-cards                # upsert into Turso (needs tursoURL/tursoAPIkey)
 *
 * Auth: uses the service-level DB client (same as /api/init), so run it from a
 * trusted machine — not from the browser.
 */
import "dotenv/config";
import { getDb, initDb } from "../src/lib/db";
import { USA_CARDS, USA_CARDS_REFRESHED } from "../src/lib/usa-cards";

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const totalBenefits = USA_CARDS.reduce((n, c) => n + c.benefits.length, 0);
  if (flag("dry-run")) {
    console.log(`USA cards catalog (researched ${USA_CARDS_REFRESHED}): ${USA_CARDS.length} cards, ${totalBenefits} benefits — dry run, writing nothing.`);
    for (const c of USA_CARDS) {
      console.log(`- ${c.name} (${c.bank}) fee $${c.annual_fee} ★${c.rating} — ${c.benefits.length} benefits`);
      for (const b of c.benefits) {
        console.log(`    ${b.reward_rate}${b.reward_type === "cashback" ? "%" : "x"} ${b.reward_type} on ${b.category} @ ${b.merchant_place}${b.cap ? ` [${b.cap}]` : ""}`);
      }
    }
    return;
  }
  await initDb();
  const db = getDb();
  let cardsAdded = 0;
  let cardsKept = 0;
  let bensAdded = 0;
  let bensKept = 0;
  for (const c of USA_CARDS) {
    const ex = (
      await db.execute({ sql: "SELECT id FROM cards WHERE name=? AND bank=? LIMIT 1", args: [c.name, c.bank] })
    ).rows[0] as unknown as { id: number } | undefined;
    let id: number;
    if (ex) {
      id = Number(ex.id);
      cardsKept++;
    } else {
      const r = await db.execute({
        sql: "INSERT INTO cards (name, bank, image_url, annual_fee, rating, apply_url) VALUES (?,?,?,?,?,?)",
        args: [c.name, c.bank, c.image_url, c.annual_fee, c.rating, c.apply_url],
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
  console.log(`\n---- usa-cards (${USA_CARDS_REFRESHED}) ----`);
  console.log(`cards: +${cardsAdded} kept ${cardsKept}  benefits: +${bensAdded} kept ${bensKept}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

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
 * No local keys? Use the dashboard's "Seed USA cards" button instead — it runs
 * the same upsert on the server (which already has the keys).
 */
import "dotenv/config";
import { seedUsaCards } from "../src/lib/seed-usa";
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
  const s = await seedUsaCards();
  console.log(`\n---- usa-cards (${USA_CARDS_REFRESHED}) ----`);
  console.log(`cards: +${s.cardsAdded} kept ${s.cardsKept}  benefits: +${s.bensAdded} kept ${s.bensKept}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

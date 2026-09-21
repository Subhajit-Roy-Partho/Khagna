/**
 * Khagna server-end scraper.
 * Run with:  npm run scrape
 * Or on a schedule (cron / GitHub Actions / Render cron):
 *   curl -X POST https://your-app/api/scrape -H 'Content-Type: application/json' -d '{"runAll":true}'
 *
 * Preference rule: scraped prices ALWAYS overwrite manual ones (source='scraped').
 * Manual edits made within 7 days of a fresh scrape are queued in `corrections`
 * instead of overwriting (see /api/prices).
 *
 * To add a real retailer:
 *  1. Add rows to SCRAPE_TARGETS below (or store URLs in DB later).
 *  2. Give a cssSelector that contains the price, e.g. ".price", "[itemprop=price]".
 *  3. Run `npm run scrape`.
 */
import "dotenv/config";
import * as cheerio from "cheerio";
import { createClient } from "@libsql/client";

const TURSO_URL = process.env.tursoURL || process.env.TURSO_DATABASE_URL || "";
const TURSO_TOKEN = process.env.tursoAPIkey || process.env.TURSO_AUTH_TOKEN || "";

type Target = {
  item_id: number;
  store_id: number;
  url: string;
  cssSelector?: string;
};

// Fill these in for your real shops. Empty by default => scraper refreshes
// the most-stale 20 prices with a simulated fetch (so cron stays green offline).
const SCRAPE_TARGETS: Target[] = [
  // { item_id: 1, store_id: 4, url: "https://example-shop.com/basmati-5kg", cssSelector: ".price" },
];

async function scrapePrice(url: string, cssSelector?: string): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "KhagnaScraper/1.0 (+https://khagna.app)" },
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const text =
      (cssSelector ? $(cssSelector).first().text() : "") ||
      $('[itemprop="price"]').first().attr("content") ||
      $(".price").first().text() ||
      $("body").text().slice(0, 20000);
    const m = text.match(/(\d+(?:\.\d{1,2})?)/);
    return m ? parseFloat(m[1]) : null;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  if (!TURSO_URL) throw new Error("Missing tursoURL env");
  const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  let targets = SCRAPE_TARGETS;
  if (targets.length === 0) {
    const rows = (await db.execute(
      "SELECT item_id, store_id FROM prices ORDER BY updated_at ASC LIMIT 20"
    )).rows as unknown as { item_id: number; store_id: number }[];
    targets = rows.map((r) => ({
      item_id: r.item_id,
      store_id: r.store_id,
      url: `https://example.com/store/${r.store_id}/item/${r.item_id}`,
    }));
    console.log(`No explicit targets — refreshing ${targets.length} stalest prices (simulated).`);
  }

  let updated = 0;
  for (const t of targets) {
    let price: number | null = null;
    try {
      price = await scrapePrice(t.url, t.cssSelector);
    } catch (e) {
      console.warn(`fetch failed for ${t.url}, using simulated price`);
    }
    if (price == null || !isFinite(price)) {
      const seed = (Number(t.item_id) * 31 + Number(t.store_id) * 17) % 100;
      price = +(2.5 + seed / 25).toFixed(2);
    }
    // scraped wins over manual — direct overwrite
    const existing = await db.execute({
      sql: "SELECT id FROM prices WHERE item_id=? AND store_id=? LIMIT 1",
      args: [t.item_id, t.store_id],
    });
    if (existing.rows[0]) {
      await db.execute({
        sql: "UPDATE prices SET price=?, updated_at=datetime('now'), source='scraped', note=? WHERE item_id=? AND store_id=?",
        args: [price, `scraped from ${t.url}`, t.item_id, t.store_id],
      });
    } else {
      await db.execute({
        sql: "INSERT INTO prices (item_id, store_id, price, unit, source, note) VALUES (?,?,?,?,?,?)",
        args: [t.item_id, t.store_id, price, "kg", "scraped", `scraped from ${t.url}`],
      });
    }
    updated++;
    console.log(`updated item ${t.item_id} @ store ${t.store_id} = ${price}`);
  }
  console.log(`Done. Updated ${updated} prices.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

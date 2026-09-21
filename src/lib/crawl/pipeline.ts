import { getDb, initDb } from "../db";
import { pricePerKg } from "../units";
import { TEMPE_STORES } from "./stores-tempe";
import { CATALOG } from "./catalog";
import { RETAILERS } from "./retailers";
import { extractOffers } from "./retailers";
import { fetchHtml, proxyMode } from "./http";
import { llmEnabled, normalizeTitle } from "./llm";
import type {
  CatalogEntry,
  CrawledOffer,
  CrawlAttempt,
  PipelineSummary,
  RetailerId,
} from "./types";

export const ALL_RETAILERS: RetailerId[] = ["walmart", "samsclub", "costco", "frys"];

export type PipelineOptions = {
  retailers?: RetailerId[];
  queries?: string[]; // catalog keys or free-text queries
  limit?: number; // offers kept per retailer×query
  timeoutMs?: number; // per-request timeout (default 25000)
  dryRun?: boolean;
  useLlm?: boolean;
  seedOnly?: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Normalized comparison value: per-kg for weights, per-package otherwise.
function normValue(o: { price: number; unit: string }): number {
  if (o.unit === "piece") return o.price;
  const ppk = pricePerKg(o.price, o.unit);
  return isFinite(ppk) ? ppk : o.price;
}

function resolveQueries(queries?: string[]): CatalogEntry[] {
  if (!queries || queries.length === 0) return CATALOG;
  return queries.map((q) => {
    const hit = CATALOG.find((c) => c.key === q.toLowerCase());
    if (hit) return hit;
    return {
      key: q.toLowerCase().replace(/\s+/g, "-"),
      query: q,
      name_en: q,
      name_bn: "",
      name_alt: "",
      category: "grocery",
      base_unit: "kg" as const,
    };
  });
}

async function ensureStore(key: string): Promise<number> {
  const db = getDb();
  const seed = TEMPE_STORES.find((s) => s.key === key)!;
  const existing = await db.execute({
    sql: "SELECT id FROM stores WHERE address=? LIMIT 1",
    args: [seed.address],
  });
  if (existing.rows[0]) return Number((existing.rows[0] as unknown as { id: number }).id);
  const r = await db.execute({
    sql: "INSERT INTO stores (name, city, address, lat, lng, phone, is_online, image_url) VALUES (?,?,?,?,?,?,0,'')",
    args: [seed.name, seed.city, seed.address, seed.lat, seed.lng, seed.phone],
  });
  return Number(r.lastInsertRowid);
}

async function ensureItem(entry: CatalogEntry, imageUrl: string): Promise<{ id: number; created: boolean }> {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id, image_url FROM items WHERE lower(name_en)=lower(?) LIMIT 1",
    args: [entry.name_en],
  });
  if (existing.rows[0]) {
    const row = existing.rows[0] as unknown as { id: number; image_url: string };
    if (!row.image_url && imageUrl) {
      await db.execute({ sql: "UPDATE items SET image_url=? WHERE id=?", args: [imageUrl, row.id] });
    }
    return { id: Number(row.id), created: false };
  }
  const r = await db.execute({
    sql: "INSERT INTO items (name_en, name_bn, name_alt, category, image_url, base_unit) VALUES (?,?,?,?,?,?)",
    args: [entry.name_en, entry.name_bn, entry.name_alt, entry.category, imageUrl, entry.base_unit],
  });
  return { id: Number(r.lastInsertRowid), created: true };
}

async function logRun(
  retailer: string,
  query: string,
  status: string,
  found: number,
  upserted: number,
  error: string,
  sampleUrl: string
) {
  const db = getDb();
  await db.execute({
    sql: "INSERT INTO crawl_runs (retailer, query, status, items_found, prices_upserted, finished_at, error, sample_url) VALUES (?,?,?,?,?,datetime('now'),?,?)",
    args: [retailer, query, status, found, upserted, error, sampleUrl],
  });
}

export async function runPipeline(opts: PipelineOptions = {}): Promise<PipelineSummary> {
  await initDb();
  const retailers = (opts.retailers ?? ALL_RETAILERS).filter((r) => ALL_RETAILERS.includes(r));
  const entries = resolveQueries(opts.queries);
  const limit = opts.limit ?? 6;
  const dryRun = opts.dryRun ?? false;
  const useLlm = (opts.useLlm ?? true) && llmEnabled() && !dryRun;

  console.log(
    `Crawl plan: ${retailers.join(",")} × ${entries.length} queries (limit ${limit}, dryRun=${dryRun}, llm=${useLlm}, proxy=${proxyMode()})`
  );

  // 1. Seed Tempe stores (real locations) — always, even for dry runs.
  const storeIds: Record<string, number> = {};
  let storesUpserted = 0;
  for (const s of TEMPE_STORES) {
    if (!retailers.includes(s.retailer as RetailerId)) continue;
    const before = await getDb().execute({
      sql: "SELECT id FROM stores WHERE address=? LIMIT 1",
      args: [s.address],
    });
    const id = await ensureStore(s.key);
    storeIds[s.key] = id;
    if (before.rows.length === 0) storesUpserted++;
  }

  const summary: PipelineSummary = {
    retailers,
    queries: entries.map((e) => e.query),
    attempts: [],
    storesUpserted,
    itemsUpserted: 0,
    pricesUpserted: 0,
    dryRun,
  };
  if (opts.seedOnly) return summary;

  // 2. Crawl each retailer × query.
  let seed = 0;
  for (const retailer of retailers) {
    const cfg = RETAILERS[retailer];
    // one store row per retailer acts as the price anchor for that retailer's offers
    const anchorKey = TEMPE_STORES.find((s) => s.retailer === retailer)?.key;
    const storeId = anchorKey ? storeIds[anchorKey] : undefined;
    for (const entry of entries) {
      const url = cfg.searchUrl(entry.query);
      const attempt: CrawlAttempt = { retailer, query: entry.query, status: "ok", offers: [], sampleUrl: url };
      try {
        const res = await fetchHtml(url, { seed: seed++, timeoutMs: opts.timeoutMs });
        if (res.blocked) {
          attempt.status = "blocked";
          attempt.blockReason = res.blocked;
          attempt.error = `Bot wall (${res.blocked}); no prices extracted. See docs/05-crawler-guide.md.`;
        } else if (!res.ok) {
          attempt.status = "error";
          attempt.error = `HTTP ${res.status} ${res.error ?? ""}`.trim();
        } else {
          const { offers } = extractOffers(res.html, retailer, limit);
          attempt.offers = offers;
          if (!offers.length) {
            attempt.status = "empty";
            attempt.error = "Page fetched but no product/price data found in markup.";
          }
        }
      } catch (e) {
        attempt.status = "error";
        attempt.error = e instanceof Error ? e.message : String(e);
      }

      // 3. Optional LLM normalization for ambiguous titles (first offer only, to save tokens).
      if (useLlm && attempt.offers.length > 0) {
        const first = attempt.offers[0];
        const norm = await normalizeTitle(first.title, cfg.label);
        if (norm) {
          first.brand = norm.brand || first.brand;
          if (norm.size_text) first.sizeText = norm.size_text;
          attempt.offers[0] = { ...first, via: `${first.via}+llm` };
        }
      }

      // 4. Upsert to Turso (never in dry-run; never write fake/simulated prices).
      // One row per item×store: keep the CHEAPEST offer by normalized value
      // (per-kg for weights, per-package otherwise) — Khagna exists to show the best option.
      let upserted = 0;
      if (!dryRun && attempt.offers.length > 0 && storeId) {
        const { id: itemId, created } = await ensureItem(entry, attempt.offers[0].imageUrl);
        if (created) summary.itemsUpserted++;
        const best = attempt.offers.reduce((a, b) => (normValue(a) <= normValue(b) ? a : b));
        const note =
          `${cfg.label} · best of ${attempt.offers.length} · ${best.title}${best.brand ? ` · ${best.brand}` : ""} · ${best.url}`.slice(0, 400);
        const existing = await getDb().execute({
          sql: "SELECT id FROM prices WHERE item_id=? AND store_id=? AND is_online=1 LIMIT 1",
          args: [itemId, storeId],
        });
        if (existing.rows[0]) {
          await getDb().execute({
            sql: "UPDATE prices SET price=?, unit=?, stock_level=?, updated_at=datetime('now'), source='scraped', note=?, image_url=? WHERE id=?",
            args: [
              best.price, best.unit, best.inStock ? "in_stock" : "out_of_stock", note, best.imageUrl,
              Number((existing.rows[0] as unknown as { id: number }).id),
            ],
          });
        } else {
          await getDb().execute({
            sql: "INSERT INTO prices (item_id, store_id, price, unit, quality, stock_level, is_online, source, note, image_url) VALUES (?,?,?,?,?,?,1,'scraped',?,?)",
            args: [itemId, storeId, best.price, best.unit, 4, best.inStock ? "in_stock" : "out_of_stock", note, best.imageUrl],
          });
        }
        upserted = 1;
        summary.pricesUpserted += upserted;
      }

      if (!dryRun) {
        await logRun(retailer, entry.query, attempt.status, attempt.offers.length, upserted, attempt.error ?? "", url);
      }
      summary.attempts.push(attempt);
      console.log(
        `[${retailer}] "${entry.query}": ${attempt.status} (${attempt.offers.length} offers, ${upserted} upserted)${attempt.blockReason ? ` — ${attempt.blockReason}` : ""}${attempt.error && attempt.status !== "blocked" ? ` — ${attempt.error}` : ""}`
      );
      await sleep(1500); // politeness delay between requests
    }
  }
  return summary;
}

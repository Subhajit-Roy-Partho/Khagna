/**
 * Khagna Tempe grocery crawler.
 *
 * Seeds 8 real stores (Walmart / Sam's / Costco / Fry's in Tempe, Mesa, Chandler),
 * crawls retailer search pages for common groceries, and upserts REAL scraped
 * prices (+ product images) into Turso. Blocked/failed attempts are logged to
 * `crawl_runs` — never simulated, never faked.
 *
 * Usage:
 *   npm run crawl:tempe -- --retailers=walmart,costco --queries=milk,eggs --limit=5
 *   npm run crawl:tempe -- --seed-only          # only seed stores, no crawling
 *   npm run crawl:tempe -- --dry-run            # fetch + parse, write nothing
 *   npm run crawl:tempe -- --no-llm             # skip LLM title normalization
 *   npm run crawl:tempe -- --no-serp            # skip Google Shopping backfill
 */
import "dotenv/config";
import { runPipeline, ALL_RETAILERS } from "../src/lib/crawl/pipeline";
import type { RetailerId } from "../src/lib/crawl/types";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split("=").slice(1).join("=");
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const retailers = (arg("retailers")?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) ??
    ALL_RETAILERS) as RetailerId[];
  const queries = arg("queries")?.split(",").map((s) => s.trim()).filter(Boolean);
  const limit = parseInt(arg("limit") || "6", 10) || 6;
  const timeoutMs = parseInt(arg("timeout") || "25000", 10) || 25000;

  const summary = await runPipeline({
    retailers,
    queries,
    limit,
    timeoutMs,
    dryRun: flag("dry-run"),
    useLlm: !flag("no-llm"),
    useSerp: !flag("no-serp"),
    seedOnly: flag("seed-only"),
  });

  console.log("\n---- summary ----");
  console.log(`stores: +${summary.storesUpserted}  items: +${summary.itemsUpserted}  prices: +${summary.pricesUpserted}`);
  const byStatus: Record<string, number> = {};
  for (const a of summary.attempts) byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
  console.log("attempts:", byStatus);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

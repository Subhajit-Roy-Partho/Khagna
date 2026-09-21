import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { runPipeline, ALL_RETAILERS } from "@/lib/crawl/pipeline";
import type { RetailerId } from "@/lib/crawl/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // crawling needs time; see route segment config docs

// POST /api/crawl { retailers?, queries?, limit?, dryRun?, seedOnly? }
// Runs the Tempe grocery crawler server-side (Vercel cron calls this nightly).
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      retailers?: RetailerId[];
      queries?: string[];
      limit?: number;
      dryRun?: boolean;
      seedOnly?: boolean;
    };
    const summary = await runPipeline({
      retailers: body.retailers?.filter((r) => (ALL_RETAILERS as string[]).includes(r)),
      queries: body.queries,
      limit: Math.min(Number(body.limit) || 6, 12),
      dryRun: body.dryRun,
      seedOnly: body.seedOnly,
    });
    return NextResponse.json({ ok: true, ...summary });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// GET /api/crawl — recent crawl runs + Tempe store coverage.
// GET /api/crawl?run=1[&retailers=frys&queries=milk,eggs&limit=5] — trigger a run.
// (Vercel cron only sends GET, so the nightly job uses this; it defaults to a
// small staples subset to stay under serverless timeouts. Use POST for full runs.)
const CRON_STAPLES = ["milk", "eggs", "bread", "chicken", "banana", "basmati", "sugar", "coffee"];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    if (sp.get("run") === "1") {
      const retailers = (sp.get("retailers")?.split(",") ?? ["frys"]).filter((r) =>
        (ALL_RETAILERS as string[]).includes(r)
      ) as RetailerId[];
      const summary = await runPipeline({
        retailers: retailers.length ? retailers : (["frys"] as RetailerId[]),
        queries: sp.get("queries")?.split(",").filter(Boolean) ?? CRON_STAPLES,
        limit: Math.min(Number(sp.get("limit")) || 5, 12),
      });
      return NextResponse.json({ ok: true, via: "cron-get", ...summary });
    }
    await initDb();
    const db = getDb();
    const runs = await db.execute("SELECT * FROM crawl_runs ORDER BY id DESC LIMIT 50");
    const coverage = await db.execute({
      sql: `SELECT s.name, s.city, COUNT(p.id) as scraped_prices, MAX(p.updated_at) as last_scrape
            FROM stores s LEFT JOIN prices p ON p.store_id=s.id AND p.source='scraped'
            WHERE s.city IN ('Tempe','Mesa','Chandler')
            GROUP BY s.id ORDER BY s.city, s.name`,
      args: [],
    });
    return NextResponse.json({ ok: true, runs: runs.rows, coverage: coverage.rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

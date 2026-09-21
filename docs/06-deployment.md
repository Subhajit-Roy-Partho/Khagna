# 06 — Deployment & operations

## Live environments

| Environment | URL | Content | Deploys |
|---|---|---|---|
| Production app (Vercel) | `https://khagna.vercel.app` | Full app: pages, APIs, Turso, cron | Auto on push to `main` |
| Preview landing (gh-pages) | `https://subhajit-roy-partho.github.io/Khagna/` | Static landing (`landing/`) | `pages.yml` Action on push |
| CI | GitHub Actions | `tsc --noEmit` + `next build --webpack` on push/PR | `ci.yml` |

## Environment variables

`.env` is gitignored — never commit it. Required in **Vercel Dashboard → Settings →
Environment Variables** (exact lowercase names; the code reads these first):

| Var | Used for |
|---|---|
| `tursoURL` | Turso connection URL (`libsql://…`) |
| `tursoAPIkey` | Turso auth token (read-write) |
| `cloudinaryCloudName` | Cloudinary uploads + delivery |
| `cloudinaryAPIkey` / `cloudinaryAPIsecret` | Cloudinary uploads |
| `LLMurl` | OpenAI-compatible base URL (title normalization) |
| `LLMkey` | LLM API key |
| `ModelsAllowed` | Comma-separated models, first = default (e.g. `qwen/qwen3.8-flash,…`) |
| `LLM_MODEL` *(optional)* | Override the default model |
| `CRAWL_PROXY` *(optional)* | Residential proxy for server-side crawls |
| `SERPAPI_KEY` *(optional)* | Google Shopping backfill for Walmart/Target/Costco/Sam's (free 100/mo) |

`NEXT_PUBLIC_GA_ID` is not needed — the GA tag ID is constants in `layout.tsx`.

## First deploy checklist (Vercel)

1. Import `Subhajit-Roy-Partho/Khagna`, framework preset Next.js.
2. Add the env vars above (all environments).
3. Deploy. Then `POST /api/init` once to create schema + seed demo data
   (the app also self-inits on first page load).
4. Run the Tempe seeder: `POST /api/crawl` with `{"seedOnly": true}` — or locally
   `npm run crawl:tempe -- --seed-only`.
5. Verify: `/api/crawl` (GET) shows Tempe coverage; `/stores` shows Fry's 🤖 prices.

## Cron

`vercel.json` schedules `GET /api/crawl?run=1` daily 06:00 UTC (8-staple subset —
Hobby plans cap function duration at 60s, so the cron path deliberately stays small;
full runs go through `POST /api/crawl`).

## Local development

```bash
npm install
npm run dev          # http://localhost:3000 (webpack mode; turbopack unsupported on old glibc)
npm run crawl:tempe -- --dry-run   # safe pipeline test, writes nothing
```

Build quirk: `npm run build` = `next build --webpack` because this host's glibc
can't load Turbopack's native bindings. Vercel builds fine either way.

## Runbook — common issues

| Symptom | Likely cause → fix |
|---|---|
| `/api/*` 500 "Missing Turso URL" | env vars missing on Vercel → add them, redeploy |
| Crawl all `blocked` | retailer bot wall (expected for Walmart/Sam's) → see crawler guide options |
| Crawl `empty` for a query | over-specific query text → shorten in `catalog.ts` |
| Prices stale | cron not firing (hobby limits) → run `POST /api/crawl` manually or via Action |
| Map blank | Leaflet CSS + client-only import; check ad-blocker isn't killing OSM tiles |
| GA shows no data | tag verified in HTML; realtime needs a real visit; reports lag ~24h |
| Icon stale in tab | hard refresh; SVG favicons cache aggressively |

## GitHub Actions inventory

- `ci.yml` — typecheck + build on push/PR to `main`.
- `pages.yml` — publishes `landing/` to gh-pages when `landing/**` changes.

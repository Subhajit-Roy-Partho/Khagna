# 02 — Architecture

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript | Server routes + static pages in one deploy |
| Styling | Tailwind CSS v4 | Responsive mobile + desktop from one codebase |
| 3D / motion | `@react-three/fiber`, `@react-three/drei`, `framer-motion` | Animated hero + page transitions (home only; sub-pages stay light) |
| Map | Leaflet + react-leaflet, OSM tiles | No API key, works everywhere |
| Database | Turso (libsql) via `@libsql/client` | Serverless SQLite, HTTP API, zero ops |
| Images | Cloudinary (`q_auto:low, f_auto`, 800px cap) for uploads; retailer hotlinks for scraped product shots | Aggressive compression where we control bytes; zero storage cost where we don't |
| Scraping | `fetch` + `cheerio`, optional OpenAI-compatible LLM | No browser needed for SSR retailers |
| Hosting | Vercel (app + cron) · GitHub Pages (static landing preview) · GitHub Actions (CI) | See deployment doc |

## Repository layout

```
src/
  app/
    page.tsx              # home (3D hero, motion)
    layout.tsx            # nav, footer, GA tag
    icon.svg              # branded app icon
    stores/page.tsx       # price comparison + map (client)
    basket/page.tsx       # basket optimizer (client)
    cards/page.tsx        # card matcher (client)
    dashboard/page.tsx    # corrections, comments, admin (client)
    api/
      items/route.ts      # item-first search, sorted cheapest
      stores/route.ts     # list / add stores
      prices/route.ts     # list / correct price (scrape-preference rule)
      cards/route.ts      # ranked cards + add card
      comments/route.ts   # flags + corrections log
      crawl/route.ts      # run Tempe crawler / view runs + coverage (maxDuration 300)
      scrape/route.ts     # legacy generic scraper endpoint
      upload/route.ts     # Cloudinary aggressive-compression upload
      init/route.ts       # create schema + seed demo data
  components/
    Hero3D.tsx            # react-three-fiber scene (ssr:false)
    Reveal.tsx            # scroll-reveal wrapper
    StoreMap.tsx          # leaflet map (ssr:false)
  lib/
    db.ts                 # Turso client, SCHEMA_SQL, initDb(), migrate(), row types
    units.ts              # kg/g/lb/oz/piece conversion + per-kg normalization
    geo.ts                # haversine, basket optimizer
    cloudinary.ts         # aggressive upload + delivery URLs
    seed-data.ts          # demo seed (used only when DB is empty)
    crawl/                # Tempe grocery crawler (see crawler guide)
      types.ts            # CrawledOffer, CrawlAttempt, seeds
      stores-tempe.ts     # 8 verified stores + coordinates
      catalog.ts          # 24 grocery queries + multilingual names
      http.ts             # UA rotation, retries, bot-wall detection
      retailers.ts        # search URLs + JSON-LD → embedded-JSON → DOM cascade
      parse-unit.ts       # "$0.08/fl oz" → normalized unit
      llm.ts              # OpenAI-compatible title normalization (optional)
      pipeline.ts         # seed → crawl → best-offer upsert → run logging
scripts/
  crawl-tempe.ts          # CLI: npm run crawl:tempe
  scraper.ts              # legacy generic scraper CLI
landing/                  # static gh-pages preview (plain HTML, no build)
docs/                     # you are here
```

## Request flows

**Price search** `GET /api/items?q=&city=&lat=&lng=&radiusKm=&unit=&online=`
→ load items → filter by multilingual match → join prices+stores → attach distance
(haversine) + per-kg value → drop out-of-range physical stores → sort cheapest-first
with scraped rows boosted → return item-first bundles. All logic server-side; the
`/stores` page only renders.

**Price correction** `POST /api/prices` → if a `scraped` row for the same item+store
was updated < 7 days ago, insert into `corrections` (pending) instead of overwriting;
otherwise update/insert the price row as `manual`.

**Card search** `GET /api/cards?category=&place=&q=` → score each card by best matching
benefit and sort. Pure function over two small tables — fast enough to run per request.

**Crawl** `POST /api/crawl` (or CLI) → seed stores → for each retailer × query:
fetch → detect block → extract (cascade) → optional LLM normalize → keep cheapest
normalized offer → upsert `prices` row (`source='scraped'`, `image_url` set) → log
`crawl_runs`. See the crawler guide for the full story.

## Key design decisions

1. **Item-first, not store-first.** Shoppers compare *one product across stores*,
   so the API returns items with nested offers — the UI never has to join.
2. **Normalized units at the core.** `pricePerKg()` makes lb/oz/g/kg mutually
   comparable; `piece` stays separate. The crawler stores the same normalized units,
   so scraped and manual rows sort together.
3. **Scraped beats manual, with receipts.** Preference is enforced in code
   (`/api/prices`), and `crawl_runs` + 🤖/👤 badges make it auditable.
4. **One row per item × store.** The crawler keeps only the cheapest normalized offer
   per query ("best of N" in the note) instead of N rows — the product is *the best
   option*, not a product feed.
5. **Images are hotlinked for scraped rows.** Retailer CDN URLs go straight into
   `prices.image_url` and render via plain `<img>` (no `next/image` remote config,
   no storage cost). Uploaded user/store photos go through Cloudinary compression.
6. **No AI in the critical path.** The LLM only normalizes ambiguous titles and is
   bypassed entirely when unconfigured or failing. Search, ranking, and optimization
   are deterministic.
7. **Additive DB migrations.** `initDb()` runs `CREATE TABLE IF NOT EXISTS` plus a
   `migrate()` step (e.g. backfilling `prices.image_url` on older databases), so
   deploys never need manual SQL.

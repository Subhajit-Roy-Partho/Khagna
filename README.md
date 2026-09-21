# Khagna — best price & best card

Next.js (App Router + Tailwind) web app, mobile + laptop responsive, no AI yet.

> 📚 **Extensive documentation lives in [`docs/`](docs/00-index.md)** — product
> overview, architecture, data model, API reference, crawler guide, deployment.
> Start there; this README is the quick-start.

- **Stores:** item-first comparison (English + Bengali + alt names), per kg/g/lb/oz/piece
  with unit converter, city + radius + map (Leaflet/OSM, no API key), distance,
  store vs online price, quality + stock flags, multi-item basket optimizer
  (cheapest + least travel). Scraped offers show the retailer's **product photo**.
- **Cards:** all benefits per card, search by category/place → ranked best card.
- **Freshness:** the Tempe grocery crawler (`npm run crawl:tempe`, `POST /api/crawl`,
  nightly cron) writes `source='scraped'` rows that **win over manual edits**.
  Manual edits within 7 days of a fresh scrape are queued in `corrections`.
  Every run is audited in `crawl_runs` — including `blocked`/`empty`, never faked.
- **DB:** Turso (libsql). **Images:** Cloudinary aggressive compression for uploads;
  retailer CDN hotlinks for scraped product shots.
- **Focus area:** Tempe AZ (+ Mesa, Chandler) — 8 real stores, 24-item catalog.

## Setup

`.env` already holds `tursoURL`, `tursoAPIkey`, `cloudinaryCloudName`,
`cloudinaryAPIkey`, `cloudinaryAPIsecret`. Keep it git-ignored.

```bash
npm install
npm run dev        # http://localhost:3000
```

First load auto-seeds demo stores/items/cards via `POST /api/init`.
(On this host use `npm run build` = `next build --webpack`; Turbopack native
bindings aren't available on its glibc.)

## Key routes

| Page | Path |
|---|---|
| Home | `/` |
| Compare prices + map | `/stores` |
| Basket optimizer | `/basket` |
| Best card | `/cards` |
| Dashboard (correct price, comment, add store, run scraper) | `/dashboard` |

| API | Purpose |
|---|---|
| `POST /api/init` | create tables + seed demo data |
| `GET /api/items?q=&city=&lat=&lng=&radiusKm=&unit=&online=` | item-first search, sorted cheapest |
| `GET/POST /api/stores` | list / add store (lat,lng,city,is_online) |
| `GET/POST /api/prices` | list / correct price (scrape-preference rule) |
| `GET/POST /api/cards?category=&place=&q=` | ranked cards + add card |
| `GET/POST /api/comments` | flags (`low_stock`,`bad_product`…), corrections log |
| `POST /api/upload` | multipart `file` → aggressively compressed Cloudinary URL |
| `POST /api/scrape` | `{"runAll":true}` or `{"targets":[{item_id,store_id,url,cssSelector}]}` |
| `POST /api/crawl` | run Tempe grocery crawler; `GET /api/crawl` shows runs + coverage |

## Tempe grocery crawler (real prices)

```bash
npm run crawl:tempe -- --retailers=frys --limit=5        # Fry's: working, with photos
npm run crawl:tempe -- --seed-only                       # just seed the 8 real stores
npm run crawl:tempe -- --dry-run                         # fetch + parse, write nothing
```

Status (measured): Fry's ✅ live · Walmart/Sam's 🛑 bot-walled · Costco ⚠️ client-rendered.
Full story + how to unblock the rest: [`docs/05-crawler-guide.md`](docs/05-crawler-guide.md).

## Scraper cron (legacy generic endpoint)

```bash
npm run scrape   # reads SCRAPE_TARGETS in scripts/scraper.ts, else refreshes stalest 20
# or: curl -X POST https://your-app/api/scrape -d '{"runAll":true}'
```

Add real retailer URLs + CSS selectors in `SCRAPE_TARGETS`.

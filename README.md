# Khagna — best price & best card

Next.js (App Router + Tailwind) web app, mobile + laptop responsive, no AI yet.

- **Stores:** item-first comparison (English + Bengali + alt names), per kg/g/lb/oz/piece
  with unit converter, city + radius + map (Leaflet/OSM, no API key), distance,
  store vs online price, quality + stock flags, multi-item basket optimizer
  (cheapest + least travel).
- **Cards:** all benefits per card, search by category/place → ranked best card.
- **Freshness:** server scraper (`POST /api/scrape`, `scripts/scraper.ts`) overwrites
  manual prices (`source='scraped'`). Manual edits within 7 days of a fresh scrape
  are queued in `corrections` for review.
- **DB:** Turso (libsql). **Images:** Cloudinary with aggressive compression
  (`q_auto:low,f_auto,strip_profile`, max 800px).

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

## Scraper cron

```bash
npm run scrape   # reads SCRAPE_TARGETS in scripts/scraper.ts, else refreshes stalest 20
# or: curl -X POST https://your-app/api/scrape -d '{"runAll":true}'
```

Add real retailer URLs + CSS selectors in `SCRAPE_TARGETS`.

# 04 — API reference

Base URL locally `http://localhost:3000`, production `https://khagna.vercel.app`.
All responses are JSON with an `ok` boolean. `POST /api/init` also seeds demo data
when tables are empty.

## Pages

| Page | Path | Description |
|---|---|---|
| Home | `/` | 3D hero, features, how-it-works |
| Compare | `/stores` | search + radius/city + map + unit converter + thumbnails + click-to-correct |
| Basket | `/basket` | multi-item cheapest + least-travel plans |
| Cards | `/cards` | category/place search → ranked cards, owned filter, add card |
| Card detail | `/cards/[id]` | DB-generated page: benefits, owned toggle, add benefit |
| Sign in | `/signin` | GitHub / Google / email+password + registration |
| Dashboard | `/dashboard` | comments/flags, add store, on-demand crawl, review queues |

> 🔒 Reads are public. All `POST`s below (except auth) return **401 unless signed in**.

## `GET /api/items` — item-first search
```
?q=basmati&city=Tempe&lat=33.42&lng=-111.93&radiusKm=10&unit=kg&online=include
```
- `q` matches `name_en + name_bn + name_alt + category` (all tokens must match).
- `online`: `include` (default) | `only` | `exclude`.
- Online stores (`lat=0`) always pass the radius filter.
- Returns `results: [{ item, options: [...cheapest-first], displayUnit }]`.
- Each option carries `distanceKm`, `pricePerKg`, `image_url`, `source`.

## `GET/POST /api/stores`
- `GET ?city=` → `{ stores }`. `POST {name, city, address, lat, lng, phone, is_online, image_url}`.

## `GET/POST /api/prices`
- `GET ?item_id=&store_id=` → recent rows (newest first, limit 200).
- `POST {item_id, store_id, price, unit, quality?, stock_level?, is_online?, comment?}`
  → `{ ok, queued }`. `queued=true` means a fresh scrape won and your edit is pending review.

## `GET /api/cards`
- `GET ?category=grocery&place=airlines&q=` → ranked `{ results }`.
- `GET ?id=12` → `{ card, benefits }` (powers `/cards/[id]`).
- `POST` (auth) — new card `{name, bank?, …, benefits?[]}` → `{ ok, id }`,
  or add one benefit `{card_id, benefit: {…}}` → `{ ok }`.

## Auth endpoints
- NextAuth: `/api/auth/*` (GitHub + Google OAuth, credentials).
- `POST /api/auth/register {name, email, password}` → creates a bcrypt-hashed
  password account (open registration, 8+ char passwords).

## `GET/POST /api/comments`
- `GET` → `{ corrections (100), comments (100) }` newest first.
- `POST {text, tag?, store_id?, item_id?}`.

## `POST /api/upload`
Multipart `file` → aggressively compressed Cloudinary URL (`q_auto:low, f_auto`,
800px cap). Used for store/item/user photos — *not* for scraped product shots
(those are hotlinked, see crawler guide).

## `POST /api/crawl` · `GET /api/crawl`
- `POST {retailers?, queries?, limit? (≤12), dryRun?, seedOnly?}` → runs the Tempe
  grocery pipeline server-side (`maxDuration: 300`, `force-dynamic`).
  ```bash
  curl -X POST https://khagna.vercel.app/api/crawl \
    -H 'Content-Type: application/json' \
    -d '{"retailers":["frys"],"queries":["milk","eggs"],"limit":5}'
  ```
- `GET /api/crawl?run=1[&retailers=frys&queries=milk,eggs&limit=5]` → trigger a run
  via GET (what Vercel cron uses; defaults to 8 staples to fit serverless timeouts).
- `GET` (no params) → `{ runs (50 latest), coverage }` where coverage lists Tempe/Mesa/Chandler
  stores with scraped-price counts + last scrape time.

## `POST /api/scrape` (legacy generic endpoint)
`{"runAll": true}` or explicit `{targets: [{item_id, store_id, url, cssSelector}]}`.
Predates the grocery crawler; kept for the dashboard "run scraper" button and cron
compatibility. The grocery pipeline (`/api/crawl`) is the maintained path.

## `GET/POST /api/init`
Creates schema (+migrations) and seeds demo stores/items/cards when empty.
Hit once after first deploy; harmless to repeat.

# 05 — Tempe grocery crawler guide

The crawler keeps Khagna's prices real: it visits retailer search pages for Tempe-area
stores, extracts price + pack size + **product photo**, normalizes units, and upserts
one best-offer row per item into Turso. Code lives in `src/lib/crawl/`, runnable via
`npm run crawl:tempe` (CLI) or `POST /api/crawl` (server, Vercel cron).

## Retailers & current status (measured Sep 2026, datacenter egress)

| Retailer | Search URL pattern | Result |
|---|---|---|
| Fry's (Kroger) | `frysfood.com/search?query=` | ✅ **Working from residential IPs** — SSR markup + embedded pricing JSON, 21/24 catalog items live. ❌ **Fails from Vercel/datacenters** (connection aborted, HTTP 0 — verified Sep 2026) |
| Walmart | `walmart.com/search?q=` | 🛑 PerimeterX `/blocked`. ✅ Reachable **via Google Shopping backfill** (needs `SERPAPI_KEY`) |
| Target | `target.com/s?search_term=` (+ `redsky` JSON API) | 🛑 PerimeterX everywhere — the storefront serves 404+captcha to bots and the `redsky` product API answers HTTP 435 + `px-captcha`. ✅ Reachable **via Google Shopping backfill** (needs `SERPAPI_KEY`) |
| Sam's Club | `samsclub.com/s/` | 🛑 PerimeterX `are-you-human` (`px-captcha`). ✅ Reachable **via Google Shopping backfill** |
| Costco | `costco.com/s?keyword=` | ⚠️ Page loads (Kasada present) but prices render client-side only — nothing extractable server-side. ✅ Reachable **via Google Shopping backfill** |

Blocked/empty outcomes are **logged, never faked**: every attempt lands in `crawl_runs`
with `status` + reason. The pipeline writes zero simulated prices.

## More sites evaluated (Sep 2026)

| Retailer | Verdict |
|---|---|
| Target (`target.com/s`) | 🛑 Captcha wall on search |
| Sprouts (`shop.sprouts.com`, Instacart platform) | 🛑 Captcha wall |
| Safeway (`safeway.com`, Albertsons) | ⚠️ 200 + 385KB but zero prices in SSR markup (JS shell) |
| ALDI (`aldi.us`) | ⚠️ Search redirects to a 404 JS shell — no SSR data |
| Bashas' / Food City (`bashas.com`, `foodcity.com`) | No product search on own domain (Instacart/Shipt storefronts, captcha); foodcity search serves captcha |

Because these can't be crawled, their **physical Tempe stores are seeded** (`retailer: "other"`
in `stores-tempe.ts`) so shoppers can compare them through manual/dashboard prices:
Sprouts Farmers Market – Elliot Rd (931 E Elliot Rd), ALDI – Southern Ave
(1715 E Southern Ave), Bashas' – Warner & McClintock (1761 E Warner Rd) — all with
verified coordinates. The pipeline always seeds `"other"` stores regardless of the
`--retailers` filter.

## How extraction works (per retailer × query)

1. **Fetch** (`http.ts`): rotating desktop user agents, 25s timeout (tunable),
   2 retries with backoff, `Accept-Language: en-US`. Follows redirects so bot-wall
   landing pages (`/blocked`, `are-you-human`) are caught by URL + HTML markers
   (`px-captcha`, `perimeterx`, `press & hold`, `kasada`, …) → status `blocked`.
2. **Extract cascade** (`retailers.ts`):
   - **JSON-LD** `Product` blocks (name, brand, offers.price, image) — best when present;
   - **Embedded JSON** scan (`__NEXT_DATA__`/Apollo-style blobs) for price/name/image triples;
   - **DOM fallback** with per-retailer selectors. For Fry's/Kroger these are:
     - card `[data-testid^="product-card-"]`, name `[data-testid="cart-page-item-description"]`,
       price `[data-testid="product-item-unit-price"]`, per-unit `[data-testid="product-item-sizing"]`
       (e.g. `$0.08/fl oz`), image `[data-testid="product-image-loaded"]`
       (`kroger.com/product/images/…`), link `a[href^="/p/"]`.
3. **Normalize units** (`parse-unit.ts`): `$0.62/oz`, `$3.99 per lb`, `5 lb bag`,
   `12 ct`, `1 gal` → `kg/g/lb/oz/piece`. Fluid ounces (`/fl oz`) map to `piece`
   (volume, compared per-package — documented, not silently converted to weight).
4. **Optional LLM normalization** (`llm.ts`): for ambiguous titles, an
   OpenAI-compatible endpoint (`LLMurl`/`LLMkey`/`ModelsAllowed` in `.env`, override
   model with `LLM_MODEL`) returns strict JSON `{brand, name_en, size_text, unit}`.
   Only the first offer per attempt is sent (token-frugal). Any failure or missing
   config → silent skip, regex parsing stands alone. Verified live against
   `qwen/qwen3.8-flash` on nano-gpt.
5. **Best-offer upsert** (`pipeline.ts`): all offers for one query collapse to the
   **cheapest by normalized value** (per-kg for weights via `pricePerKg()`,
   per-package otherwise) → single `prices` row with `source='scraped'`,
   `is_online=1`, `image_url` = retailer photo, `note` = retailer · best-of-N ·
   title · product URL. New catalog items are created with Bengali/alt names from
   `catalog.ts`; existing items get their photo backfilled if empty.

## Product images

Scraped `prices.image_url` values are **hotlinked retailer CDN URLs** (e.g.
`https://www.kroger.com/product/images/medium/front/…`). The `/stores` table renders
them with plain lazy `<img>` (with onError-hide fallback 🛒) rather than `next/image`,
so no `remotePatterns` config or storage is needed. User/store uploads are the
opposite path: multipart → Cloudinary aggressive compression → stored URL.

## catalog & store seeds

- `catalog.ts`: 24 queries (dairy, produce, meat, bakery, spices) with
  `name_en/name_bn/name_alt`. **Query wording matters**: retailer search is literal —
  `red lentils masoor dal` returns nothing while `red lentils` returns 13 cards.
  Prefer short queries; keep the rich names on the item.
- `stores-tempe.ts`: 8 verified stores (address + Nominatim coordinates). The seeder
  matches on `address`, so re-runs never duplicate.

## Running it

```bash
npm run crawl:tempe -- --retailers=frys --queries=milk,eggs --limit=5
npm run crawl:tempe -- --retailers=walmart,costco --limit=5 --timeout=15000 --no-llm
npm run crawl:tempe -- --seed-only     # stores only, no HTTP
npm run crawl:tempe -- --dry-run       # fetch + parse, write nothing
npm run crawl:tempe -- --timeout=12000 # per-request ms (cron tuning)
```

`--queries` accepts catalog keys (`milk`) or free text (`"oat milk"`).
Politeness: 1.5s delay between requests. Proxy-aware: set `CRAWL_PROXY` (logged,
residential proxies are the realistic way past Walmart/Sam's walls from servers).

## Scheduling

- **Vercel cron** (`vercel.json`): `GET /api/crawl?run=1&retailers=frys,target,walmart,samsclub,costco&limit=3`
  every **Monday 06:00 UTC** (weekly — fits Hobby plan limits and the SerpApi free
  tier: 8 staples ≈ 8 searches/week ≈ 32/month + free cache repeats). Vercel cron
  only sends GET, so that path runs the pipeline with an 8-staple subset
  (milk, eggs, bread, chicken, banana, basmati, sugar, coffee) to stay under
  serverless timeouts (Hobby caps `maxDuration` at 60s despite the route's 300s setting).
  Override inline, e.g. `/api/crawl?run=1&retailers=frys&queries=milk,eggs&limit=5`.
  Use `POST /api/crawl` (no subset) for full 24-query runs from anywhere else.
- **On demand**: the dashboard has a “Run grocery crawl now” button (same pipeline,
  sign-in required), or `POST /api/crawl` with any HTTP client.
- **GitHub Actions**: add a `schedule:` workflow POSTing to `/api/crawl` — needs no
  secrets beyond the public URL, but datacenter IPs face the same bot walls.
- **Your own machine (recommended for real refreshes)**: residential IPs succeed where
  datacenters fail — `npm run crawl:tempe` locally, on a cron/Task Scheduler, is
  currently the reliable way to refresh Fry's prices. Verified: sandbox run wrote
  21 live prices; the identical run from Vercel aborts at the network level.

## Google Shopping backfill — the better way for walled retailers (implemented)

Direct scraping loses to PerimeterX/Kasada, so the pipeline has a second source:
**Google Shopping results via SerpApi** (`src/lib/crawl/serpapi.ts`). Google already
did the hard work of rendering those merchant pages; one query returns offers from
*all* merchants, so a single call per catalog query covers Walmart + Target + Costco
+ Sam's at once. Results are location-scoped (`location=Tempe,Arizona`), carry
`extracted_price` numbers + `thumbnail` photos, and map to our store anchors by
merchant name (unmatched merchants like Amazon/eBay are ignored, 2 offers kept per
merchant, cheapest upserted with a "via Google Shopping" note).

- **Fills gaps only**: merchants whose direct crawl already found offers are skipped.
- **Without `SERPAPI_KEY` the whole phase is a silent no-op** (verified) — never throws.
- **Cost**: free tier = 100 searches/month; identical repeat queries hit SerpApi's
  cache and are free. A full 24-query run = 24 searches (~4 runs/month free);
  the 8-staple cron subset = 8 searches.
- **Setup**: sign up at serpapi.com → copy API key → `SERPAPI_KEY=…` in `.env`
  (+ Vercel env vars). Then `npm run crawl:tempe -- --retailers=target,walmart --limit=3`
  (drop `--no-serp`). Mapping logic is fixture-tested (12 assertions, no key needed).

## Getting the blocked retailers for real (honest options)

1. **Official APIs (recommended).** Kroger's Products API (covers Fry's) offers free
   developer credentials with real prices/images — strictly better than scraping and
   the natural next integration. Walmart's affiliate/marketplace APIs are the
   equivalent path there; both beat fighting PerimeterX.
2. **Residential proxy** via `CRAWL_PROXY` for server-side runs.
3. **Headless browser** (Playwright) for Costco's client-rendered prices — heavier,
   still detectable, still against ToS (see below).

## A note on scraping & terms

Retailer sites' terms generally prohibit automated collection, and bot walls exist to
enforce that. Khagna crawls politely (1.5s delays, product-search pages only, no
account/checkout flows, attribution in the user agent), prefers official APIs where
they exist, and never republishes full catalogs — only price facts shoppers could see
themselves. If a retailer asks to stop, disable that adapter (`--retailers=` flag
makes this one word) and use their official API instead.

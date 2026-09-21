# 01 — Product overview

**Khagna** (খাগনা) answers one question: *where should I buy this, and with which card?*

## The problem

- The same product sells at wildly different prices across nearby stores — and many
  Indian / Middle-East / small grocers don't publish prices at all (or publish stale ones).
- Units differ per store (per lb vs per kg vs per piece), so "cheap" is hard to compare.
- Credit cards pay different rewards per category and merchant, so the best card changes
  per purchase.

## What Khagna does

### 🛒 Store price comparison (`/stores`)
- **Item-first view:** each product is listed once (English + Bengali + nickname, e.g.
  *Basmati Rice / বাসমতী চাল / long grain rice*), then every store's offer is shown
  underneath with quoted price, converted price, quality, stock flag, distance, and source.
- **Unit converter:** pick per kg / g / lb / oz / piece; weight prices are normalized to
  per-kg so sorting is fair. Piece items sort separately (they're not weight-comparable).
- **Location-aware:** use GPS or pick a city; set a radius (km); stores render on a
  Leaflet/OpenStreetMap map with a radius circle. Online offers always pass the filter.
- **Store vs online:** filter both / online-only / physical-only.
- **Product photos:** scraped offers carry the retailer's own product image so shoppers
  can confirm the exact pack.

### 🧺 Basket optimizer (`/basket`)
Enter several items with quantities → Khagna returns up to 5 plans ranked by
`subtotal + $2 per extra store stop + ~$0.30/km round-trip travel`, i.e. cheapest
overall *with least travel*. Includes single-store (minimum travel) options.

### 💳 Card matcher (`/cards`)
Every card catalogues all its benefits (category, merchant/place, rate, cap, description).
Search a category (*grocery*), a place (*airlines*, *online*), or free text → cards are
ranked by `best matching rate × 10 + rating − annual_fee/1000`.

### 🙋 Dashboard (`/dashboard`)
- Correct a price (goes live immediately — unless a fresh scrape exists, see below).
- Comment / flag: `low_stock`, `out_of_stock`, `bad_product`, `good_deal`, `price_wrong`.
- Add stores, add cards + benefits, trigger scrapes, review the corrections queue.

## Data freshness model

1. **Scraped prices win over manual ones.** The Tempe grocery crawler
   (`npm run crawl:tempe`, `/api/crawl`, nightly Vercel cron) writes rows with
   `source='scraped'`, shown with a 🤖 badge and ranked first.
2. **Manual edits within 7 days of a fresh scrape don't overwrite it** — they're queued
   in `corrections` with status `pending` for review. Older scrapes get replaced directly.
3. Every automated run is logged in `crawl_runs` (retailer × query × status), including
   `blocked`/`empty` outcomes — no silent failures, no fake data.

## Current geographic focus: Tempe, AZ (+ Mesa, Chandler)

11 real seeded stores with verified addresses and coordinates — 8 crawlable-retailer
locations plus 3 local favorites (Sprouts, ALDI, Bashas') seeded for manual-price
comparison since their sites can't be crawled (see crawler guide):

| Store | Address |
|---|---|
| Walmart Supercenter – Elliot Rd | 1380 W Elliot Rd, Tempe, AZ 85284 |
| Walmart Supercenter – Southern Ave | 800 E Southern Ave, Tempe, AZ 85282 |
| Costco Wholesale – Tempe | 1445 W Elliot Rd, Tempe, AZ 85284 |
| Costco Wholesale – Chandler | 595 S Galleria Way, Chandler, AZ 85226 |
| Costco Wholesale – Mesa | 1444 S Sossaman Rd, Mesa, AZ 85209 |
| Sam's Club – Tempe (#4956) | 2080 E Rio Salado Pkwy, Tempe, AZ 85288 |
| Sam's Club – Chandler (#6213) | 700 N 54th St, Chandler, AZ 85226 |
| Fry's Marketplace – Baseline & McClintock | 5100 S McClintock Dr, Tempe, AZ 85282 |
| Sprouts Farmers Market – Elliot Rd *(manual prices)* | 931 E Elliot Rd, Tempe, AZ 85284 |
| ALDI – Southern Ave *(manual prices)* | 1715 E Southern Ave, Tempe, AZ 85282 |
| Bashas' – Warner & McClintock *(manual prices)* | 1761 E Warner Rd, Tempe, AZ 85284 |

24-item grocery catalog (dairy, produce, meat, bakery, spices incl. Bengali names).
Live scraped prices currently come from **Fry's** (see the crawler guide for why).

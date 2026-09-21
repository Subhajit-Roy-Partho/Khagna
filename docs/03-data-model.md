# 03 — Data model (Turso / SQLite)

## Entity diagram (text)

```
stores 1───∞ prices ∞───1 items
  │                    │
  │                    └── image_url (first scraped photo, or upload)
  ├── lat/lng/city (radius + distance)
  └── is_online (online-only sellers)

cards 1───∞ card_benefits

prices.source = 'scraped'  → wins over 'manual' (see rule below)
prices.image_url           → retailer product photo (hotlink)
prices.note                → provenance: "Fry's (Kroger) · best of 5 · <title> · <url>"

corrections                → queued manual edits blocked by a fresh scrape
comments                   → user flags (low_stock, bad_product, …)
crawl_runs                 → one row per retailer × query attempt (incl. blocked/empty)
```

## Tables

### stores
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | e.g. "Fry's Marketplace – Baseline & McClintock" |
| city | TEXT | Tempe / Mesa / Chandler / … (radius + coverage queries) |
| address | TEXT | unique anchor used by the seeder |
| lat / lng | REAL | verified via Nominatim; `0,0` = online-only |
| phone | TEXT | |
| is_online | INTEGER 0/1 | online sellers bypass the radius filter |
| image_url | TEXT | store photo (upload) |

### items
One row per product concept, matched case-insensitively on `name_en` by the crawler.
`name_bn` / `name_alt` carry Bengali + nicknames for multilingual search.
`base_unit` is `kg` (weighable) or `piece`.

### prices (the heart of the app)
| col | notes |
|---|---|
| item_id, store_id | FKs; crawler anchors one row per item × store with `is_online=1` |
| price, unit | quoted price + normalized unit (`kg/g/lb/oz/piece`) |
| quality | 1–5 ★ (manual) / 4 default (scraped) |
| stock_level | `in_stock/low_stock/out_of_stock/bad_product` → UI badges |
| is_online | distinguishes shelf vs online offer at the same store |
| source | **`manual` or `scraped`** — drives ranking + edit rules |
| note | provenance incl. retailer product URL |
| image_url | retailer product photo (added by migration on old DBs) |

### cards / card_benefits
Card + one row per perk: `category` (grocery/dining/travel/fuel/…),
`merchant_place` (`any` matches everything), `reward_rate`, `reward_type`
(cashback/miles/points), `cap`, `description`.

### corrections
`price_id, item_id, store_id, old_price, new_price, comment, status(pending/…)`.
Written by `POST /api/prices` when a fresh scrape blocks a direct overwrite.

### comments
`store_id?, item_id?, text, tag(info/low_stock/out_of_stock/bad_product/good_deal/price_wrong)`.

### crawl_runs
`retailer, query, status(ok/blocked/error/empty), items_found, prices_upserted,
started_at, finished_at, error, sample_url`. This is the crawler's audit trail —
see the crawler guide for what each status means.

## The scraped-beats-manual rule (enforced in `POST /api/prices`)

```
if existing.source == 'scraped' and age(updated_at) < 7 days:
    → INSERT INTO corrections (…, status='pending')   # queued, no overwrite
else:
    → UPDATE/INSERT prices … source='manual'
```

The crawler itself always overwrites (`source='scraped'`), regardless of age.

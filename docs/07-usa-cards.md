# 07 — USA credit-card catalog

Researched **2026-09-27** from issuer pages + Forbes Advisor / CNBC Select /
Bankrate / CNN Underscored / Money.com grocery-card roundups.

## Coverage (19 cards, ~50 benefits)

| Card | Bank | Fee | Grocery earn |
|---|---|---|---|
| Blue Cash Preferred | Amex | $95 ($0 yr 1) | 6% US supermarkets, up to $6k/yr |
| Blue Cash Everyday | Amex | $0 | 3% US supermarkets / online retail / gas, $6k each |
| Gold Card | Amex | $325 | 4x MR at US supermarkets, up to $25k/yr |
| Savor Cash Rewards | Capital One | $0 | 3% grocery (excl. superstores) + dining/entertainment |
| Sapphire Preferred | Chase | $95 | 3x UR on online groceries (excl. Target/Walmart/clubs) |
| Custom Cash | Citi | $0 | 5% in top category (grocery eligible), $500/mo |
| Strata Premier | Citi | $95 | 3x ThankYou at supermarkets |
| Strata | Citi | $0 | 3x ThankYou at supermarkets |
| Double Cash | Citi | $0 | 2% flat (1% + 1%) |
| Freedom Flex | Chase | $0 | 5% rotating quarters (groceries recur), $1.5k/qtr |
| Freedom Unlimited | Chase | $0 | 1.5% flat, 3% dining/drugstores |
| it Cash Back | Discover | $0 | 5% rotating quarters, $1.5k/qtr, yr-1 match |
| Customized Cash Rewards | BofA | $0 | 3% choice category + 2% grocery/wholesale, $2.5k/qtr |
| Active Cash | Wells Fargo | $0 | 2% flat |
| Prime Visa | Chase | $0 + Prime | 5% Whole Foods/Amazon |
| Costco Anywhere Visa | Citi | $0 + membership | 2% Costco, 4% gas ($7k), 3% dining |
| Circle Card | Target | $0 | 5% off Target |
| Sam's Club Mastercard | Synchrony | $0 + membership | 5% gas ($6k), 3% dining, 1% club |
| Family Rewards Mastercard | U.S. Bank (Kroger family) | $0 | up to 5% at Kroger/Fry's/King Soopers/Ralphs… |

Key gotcha encoded in the data: Amex-style "supermarkets" rates **exclude**
Walmart, Target and warehouse clubs — `merchant_place: "supermarkets"` vs
`"grocery"`/`"wholesale"` keeps the /cards matcher honest.

## Seeding

```bash
npm run seed:usa-cards -- --dry-run   # preview, writes nothing
npm run seed:usa-cards                # upsert into Turso (needs tursoURL/tursoAPIkey)
```

Idempotent: matches cards by `(name, bank)`, adds only missing benefits.
Re-running after a catalog refresh is safe. Verify at `/cards?category=grocery`.

## Refreshing

Rates change — re-check issuer pages (only `apply_url`s in the catalog were
directly confirmed; others intentionally left blank, don't guess them) and bump
`USA_CARDS_REFRESHED` in `src/lib/usa-cards.ts`. Direct scraping of issuer
sites is not used: they are bot-walled (same lesson as the grocery crawler —
see `docs/05-crawler-guide.md`), so this catalog is curated from issuer pages +
reputable roundups instead of scraped HTML.

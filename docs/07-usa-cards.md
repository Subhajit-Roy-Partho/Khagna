# 07 — USA credit-card catalog

Researched **2026-09-27** from issuer pages (Amex, Capital One, Chase, Citi,
Wells Fargo, U.S. Bank, Discover, Venmo, PayPal) + Forbes Advisor / CNBC
Select / Bankrate / CNN Underscored / Money.com / NerdWallet roundups.

## Coverage (44 cards, 133 benefits)

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
| Venture X / Venture / VentureOne | Capital One | $395 / $95 / $0 | 2x–10x miles, portal bonuses |
| Sapphire Reserve | Chase | $795 | 8x portal, 4x flights/hotels direct, 3x dining + $300 travel credit |
| Platinum Card | Amex | $895 | 5x flights + prepaid hotels |
| Hilton Surpass / Hilton Honors | Amex | $150 / $0 | 6x / 5x groceries + dining + gas |
| Delta Gold / Blue | Amex | $150 ($0 yr 1) / $0 | 2x supermarkets + dining |
| Bonvoy Boundless / Explorer | Chase | $95 | 3x / 2x grocery, dining, travel |
| Autograph / Journey / One Key | Wells Fargo | $0 / $95 / $0 | 3x dining-travel-gas / 5x hotels / 3x grocery |
| Altitude Go | U.S. Bank | $0 | 4x dining, 2x grocery/gas/streaming |
| EveryDay | Amex | $0 | 2x supermarkets + 20% bonus months |
| it Miles / it Chrome | Discover | $0 | 1.5x matched yr 1 / 2% gas + dining |
| Venmo Visa / PayPal MC | Synchrony | $0 | 3%/2%/1% auto / 3% PayPal + 1.5% |
| MileUp / AT&T Points Plus | Citi | $0 | 2x grocery incl. delivery |
| Travel Rewards | BofA | $0 | 1.5x everything |
| Fidelity Rewards Visa | Elan | $0 | 2% into Fidelity |
| Quicksilver | Capital One | $0 | 1.5% everything |

Key gotcha encoded in the data: Amex-style "supermarkets" rates **exclude**
Walmart, Target and warehouse clubs — `merchant_place: "supermarkets"` vs
`"grocery"`/`"wholesale"` keeps the /cards matcher honest.

## Issuer contact fields

`cards` has `customer_care`, `fraud_number`, `bank_website` (migrated
additively — old DBs pick them up on boot). Seed data fills `bank_website`
for major issuers; **phone numbers are intentionally blank** — they change and
a wrong number is worse than none. Users add them per-card from the card
dashboard (card detail page → Edit card details), which also supports card
image upload (Cloudinary) and PATCH updates via `PATCH /api/cards`.

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

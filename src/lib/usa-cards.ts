// Curated USA credit-card catalog for Khagna's /cards matcher.
//
// Researched Sep 2026 from issuer pages + Forbes Advisor / CNBC Select /
// Bankrate / CNN Underscored / Money.com / NerdWallet roundups
// (full source list in docs/07-usa-cards.md). Reward rates + annual fees change —
// re-verify against the issuer page before applying; `apply_url` is set only
// where the issuer URL was directly confirmed, otherwise "".
//
// `bank_website` holds the issuer's homepage (confident domains only).
// `customer_care` / `fraud_number` are intentionally left "" in seed data —
// phone numbers change and misdialing is worse than blank; cardholders add
// them per-card from the card dashboard (card detail page).
//
// Conventions (must match the /cards scoring in src/app/api/cards/route.ts):
// - category: grocery | dining | travel | fuel | online | pharmacy | other
// - merchant_place: "supermarkets" = standalone US supermarkets ONLY
//   (Amex-style: excludes Walmart/Target/Costco superstores & warehouse clubs);
//   "grocery" = broader grocery incl. delivery; "wholesale" = clubs;
//   "online" = online purchases; "any" = everywhere.
// - reward_type: cashback | points | miles. For points/miles the rate is "x".

export type UsaCardBenefit = {
  category: string;
  merchant_place: string;
  reward_rate: number;
  reward_type: "cashback" | "points" | "miles";
  cap: string;
  description: string;
};

export type UsaCard = {
  name: string;
  bank: string;
  image_url: string;
  annual_fee: number;
  rating: number;
  apply_url: string;
  bank_website: string;
  benefits: UsaCardBenefit[];
};

export const USA_CARDS_REFRESHED = "2026-09-27";

export const USA_CARDS: UsaCard[] = [
  {
    name: "Blue Cash Preferred",
    bank: "American Express",
    image_url: "",
    annual_fee: 95,
    rating: 4.8,
    apply_url: "https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 6, reward_type: "cashback", cap: "up to $6,000/yr, then 1%", description: "6% cash back at U.S. supermarkets (excludes superstores & warehouse clubs)" },
      { category: "online", merchant_place: "any", reward_rate: 6, reward_type: "cashback", cap: "", description: "6% cash back on select U.S. streaming subscriptions" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back at U.S. gas stations and on transit" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Blue Cash Everyday",
    bank: "American Express",
    image_url: "",
    annual_fee: 0,
    rating: 4.6,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr per category, then 1%", description: "3% cash back at U.S. supermarkets" },
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr, then 1%", description: "3% cash back on U.S. online retail purchases" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr, then 1%", description: "3% cash back at U.S. gas stations" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "EveryDay",
    bank: "American Express",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 2, reward_type: "points", cap: "up to $6,000/yr, then 1x; +20% bonus in months with 20+ transactions", description: "2x Membership Rewards points at U.S. supermarkets" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Gold Card",
    bank: "American Express",
    image_url: "",
    annual_fee: 325,
    rating: 4.7,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 4, reward_type: "points", cap: "up to $25,000/yr, then 1x", description: "4x Membership Rewards points at U.S. supermarkets" },
      { category: "dining", merchant_place: "any", reward_rate: 4, reward_type: "points", cap: "", description: "4x points at restaurants worldwide" },
      { category: "travel", merchant_place: "airlines", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on flights booked directly with airlines" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Platinum Card",
    bank: "American Express",
    image_url: "",
    annual_fee: 895,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "travel", merchant_place: "airlines", reward_rate: 5, reward_type: "points", cap: "flights direct or via Amex Travel, up to $500k/yr", description: "5x Membership Rewards points on flights" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "prepaid hotels via Amex Travel", description: "5x points on prepaid hotels" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Hilton Honors Surpass",
    bank: "American Express",
    image_url: "",
    annual_fee: 150,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 6, reward_type: "points", cap: "U.S. supermarkets; $0 intro annual fee year 1, then $150", description: "6x Hilton Honors points at U.S. supermarkets" },
      { category: "dining", merchant_place: "any", reward_rate: 6, reward_type: "points", cap: "U.S. restaurants", description: "6x points at U.S. restaurants" },
      { category: "fuel", merchant_place: "any", reward_rate: 6, reward_type: "points", cap: "U.S. gas stations", description: "6x points at U.S. gas stations" },
      { category: "online", merchant_place: "any", reward_rate: 4, reward_type: "points", cap: "U.S. online retail", description: "4x points on U.S. online retail purchases" },
      { category: "travel", merchant_place: "any", reward_rate: 12, reward_type: "points", cap: "Hilton portfolio directly", description: "12x points at Hilton hotels & resorts" },
      { category: "other", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on all other purchases" },
    ],
  },
  {
    name: "Hilton Honors",
    bank: "American Express",
    image_url: "",
    annual_fee: 0,
    rating: 4.2,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 5, reward_type: "points", cap: "U.S. supermarkets", description: "5x Hilton Honors points at U.S. supermarkets" },
      { category: "dining", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "U.S. restaurants", description: "5x points at U.S. restaurants" },
      { category: "fuel", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "U.S. gas stations", description: "5x points at U.S. gas stations" },
      { category: "travel", merchant_place: "any", reward_rate: 7, reward_type: "points", cap: "Hilton portfolio directly", description: "7x points at Hilton hotels & resorts" },
      { category: "other", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on all other purchases" },
    ],
  },
  {
    name: "Delta SkyMiles Gold",
    bank: "American Express",
    image_url: "",
    annual_fee: 150,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 2, reward_type: "miles", cap: "$0 intro annual fee year 1, then $150", description: "2x Delta miles at U.S. supermarkets" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "", description: "2x miles at restaurants" },
      { category: "travel", merchant_place: "airlines", reward_rate: 2, reward_type: "miles", cap: "Delta purchases directly", description: "2x miles on Delta purchases" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "miles", cap: "", description: "1x miles on all other purchases" },
    ],
  },
  {
    name: "Delta SkyMiles Blue",
    bank: "American Express",
    image_url: "",
    annual_fee: 0,
    rating: 4.0,
    apply_url: "",
    bank_website: "https://americanexpress.com",
    benefits: [
      { category: "travel", merchant_place: "airlines", reward_rate: 2, reward_type: "miles", cap: "Delta purchases directly", description: "2x Delta miles on Delta purchases" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "", description: "2x miles at restaurants" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "miles", cap: "", description: "1x miles on all other purchases" },
    ],
  },
  {
    name: "Savor Cash Rewards",
    bank: "Capital One",
    image_url: "",
    annual_fee: 0,
    rating: 4.7,
    apply_url: "https://www.capitalone.com/credit-cards/savor/",
    bank_website: "https://capitalone.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "cashback", cap: "excludes superstores like Walmart & Target", description: "3% cash back at grocery stores" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining and entertainment" },
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on popular streaming services" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "hotels, vacation rentals & rental cars via Capital One Travel", description: "5% cash back on travel portal bookings" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Venture X",
    bank: "Capital One",
    image_url: "",
    annual_fee: 395,
    rating: 4.6,
    apply_url: "https://www.capitalone.com/credit-cards/venture-x/",
    bank_website: "https://capitalone.com",
    benefits: [
      { category: "travel", merchant_place: "any", reward_rate: 10, reward_type: "miles", cap: "hotels & rental cars via Capital One Travel; $300 annual travel credit + 10k anniversary miles", description: "10x miles on hotels & rental cars" },
      { category: "travel", merchant_place: "airlines", reward_rate: 5, reward_type: "miles", cap: "flights & vacation rentals via Capital One Travel", description: "5x miles on flights & vacation rentals" },
      { category: "other", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "", description: "2x miles on every purchase" },
    ],
  },
  {
    name: "Venture Rewards",
    bank: "Capital One",
    image_url: "",
    annual_fee: 95,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://capitalone.com",
    benefits: [
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "miles", cap: "hotels & rental cars via Capital One Travel", description: "5x miles on hotels & rental cars" },
      { category: "other", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "", description: "2x miles on every purchase" },
    ],
  },
  {
    name: "VentureOne Rewards",
    bank: "Capital One",
    image_url: "",
    annual_fee: 0,
    rating: 4.2,
    apply_url: "",
    bank_website: "https://capitalone.com",
    benefits: [
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "miles", cap: "hotels & rental cars via Capital One Travel", description: "5x miles on hotels & rental cars" },
      { category: "other", merchant_place: "any", reward_rate: 1.25, reward_type: "miles", cap: "", description: "1.25x miles on every purchase" },
    ],
  },
  {
    name: "Quicksilver",
    bank: "Capital One",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://capitalone.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 1.5, reward_type: "cashback", cap: "", description: "1.5% cash back on every purchase, including groceries" },
    ],
  },
  {
    name: "Sapphire Preferred",
    bank: "Chase",
    image_url: "",
    annual_fee: 95,
    rating: 4.7,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "grocery", merchant_place: "online", reward_rate: 3, reward_type: "points", cap: "excludes Target, Walmart & wholesale clubs", description: "3x Ultimate Rewards points on online grocery purchases" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on dining and select streaming services" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "booked through Chase Travel", description: "5x points on travel booked through Chase Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Sapphire Reserve",
    bank: "Chase",
    image_url: "",
    annual_fee: 795,
    rating: 4.6,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "travel", merchant_place: "any", reward_rate: 8, reward_type: "points", cap: "booked through Chase Travel; $300 annual travel credit", description: "8x points on Chase Travel purchases" },
      { category: "travel", merchant_place: "airlines", reward_rate: 4, reward_type: "points", cap: "flights & hotels booked direct", description: "4x points on flights & hotels booked direct" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "plus $300 annual dining credit at Exclusive Tables", description: "3x points on dining worldwide" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Freedom Flex",
    bank: "Chase",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "rotating quarterly categories, up to $1,500/qtr after activation", description: "5% cash back in rotating quarterly categories (groceries appear most years)" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining and drugstores" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "booked through Chase Travel", description: "5% cash back on travel booked through Chase Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Freedom Unlimited",
    bank: "Chase",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining and drugstores" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "booked through Chase Travel", description: "5% cash back on travel booked through Chase Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1.5, reward_type: "cashback", cap: "", description: "1.5% cash back on all other purchases (incl. groceries)" },
    ],
  },
  {
    name: "Marriott Bonvoy Boundless",
    bank: "Chase",
    image_url: "",
    annual_fee: 95,
    rating: 4.2,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 3, reward_type: "points", cap: "first $6,000/yr combined grocery + gas + dining, then 2x", description: "3x Bonvoy points at grocery stores" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "first $6,000/yr combined, then 2x", description: "3x points at gas stations" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "first $6,000/yr combined, then 2x", description: "3x points on dining" },
      { category: "travel", merchant_place: "any", reward_rate: 6, reward_type: "points", cap: "Marriott Bonvoy hotels directly", description: "6x points at Marriott hotels" },
      { category: "other", merchant_place: "any", reward_rate: 2, reward_type: "points", cap: "", description: "2x points on all other purchases" },
    ],
  },
  {
    name: "Explorer (United)",
    bank: "Chase",
    image_url: "",
    annual_fee: 95,
    rating: 4.2,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "$0 intro annual fee year 1, then $95", description: "2x United miles on dining" },
      { category: "travel", merchant_place: "any", reward_rate: 2, reward_type: "miles", cap: "United purchases & hotel stays", description: "2x miles on United purchases and hotels" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "miles", cap: "", description: "1x miles on all other purchases" },
    ],
  },
  {
    name: "Prime Visa",
    bank: "Chase",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://chase.com",
    benefits: [
      { category: "grocery", merchant_place: "whole foods", reward_rate: 5, reward_type: "cashback", cap: "requires Prime membership", description: "5% cash back at Whole Foods Market and Amazon with Prime" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "", description: "2% cash back at restaurants, gas stations and on transit" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Custom Cash",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 5, reward_type: "cashback", cap: "top category only, up to $500/billing cycle, then 1%", description: "5% cash back in your top eligible category each billing cycle (grocery eligible)" },
      { category: "dining", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "top category only, up to $500/billing cycle", description: "5% cash back if dining is your top category that cycle" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Strata Premier",
    bank: "Citi",
    image_url: "",
    annual_fee: 95,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "points", cap: "", description: "3x ThankYou points at supermarkets (no foreign transaction fees)" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points at restaurants" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points at gas stations" },
      { category: "travel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on air travel and hotels" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Strata",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "points", cap: "", description: "3x ThankYou points at supermarkets" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Double Cash",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "1% on purchase + 1% on payment", description: "2% cash back on everything (1% when you buy, 1% when you pay)" },
    ],
  },
  {
    name: "AAdvantage MileUp",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.0,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 2, reward_type: "miles", cap: "includes grocery delivery services", description: "2x AAdvantage miles at grocery stores" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "miles", cap: "", description: "1x miles on all other purchases" },
    ],
  },
  {
    name: "AT&T Points Plus",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 3.9,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 2, reward_type: "points", cap: "includes grocery delivery services", description: "2x ThankYou points at grocery stores" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Costco Anywhere Visa",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://citi.com",
    benefits: [
      { category: "grocery", merchant_place: "wholesale", reward_rate: 2, reward_type: "cashback", cap: "requires Costco membership", description: "2% cash back at Costco and costco.com" },
      { category: "fuel", merchant_place: "any", reward_rate: 4, reward_type: "cashback", cap: "up to $7,000/yr, then 1%", description: "4% cash back on gas and EV charging worldwide" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on restaurants and travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "it Cash Back",
    bank: "Discover",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    bank_website: "https://discover.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "rotating quarterly categories, up to $1,500/qtr after activation", description: "5% cash back in rotating quarterly categories (grocery quarters recur)" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "cashback matched in year 1", description: "1% cash back on all other purchases; all year-1 cashback matched" },
    ],
  },
  {
    name: "it Chrome",
    bank: "Discover",
    image_url: "",
    annual_fee: 0,
    rating: 4.1,
    apply_url: "",
    bank_website: "https://discover.com",
    benefits: [
      { category: "fuel", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "up to $1,000/qtr combined gas + restaurants, then 1%; matched year 1", description: "2% cash back at gas stations" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "up to $1,000/qtr combined, then 1%; matched year 1", description: "2% cash back at restaurants" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "matched year 1", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "it Miles",
    bank: "Discover",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://discover.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 1.5, reward_type: "miles", cap: "all Miles matched at end of year 1", description: "1.5x Miles on every purchase, including groceries" },
    ],
  },
  {
    name: "Customized Cash Rewards",
    bank: "Bank of America",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://bankofamerica.com",
    benefits: [
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "choice category, $2,500/qtr combined with grocery, then 1%", description: "3% cash back in your choice category (online shopping covers grocery pickup/delivery)" },
      { category: "grocery", merchant_place: "grocery", reward_rate: 2, reward_type: "cashback", cap: "$2,500/qtr combined, then 1%", description: "2% cash back at grocery stores and wholesale clubs" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Travel Rewards",
    bank: "Bank of America",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://bankofamerica.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 1.5, reward_type: "points", cap: "", description: "1.5x points on every purchase, including groceries" },
    ],
  },
  {
    name: "Active Cash",
    bank: "Wells Fargo",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    bank_website: "https://wellsfargo.com",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "", description: "2% cash back on all purchases, including groceries" },
    ],
  },
  {
    name: "Autograph",
    bank: "Wells Fargo",
    image_url: "",
    annual_fee: 0,
    rating: 4.6,
    apply_url: "",
    bank_website: "https://wellsfargo.com",
    benefits: [
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on restaurants" },
      { category: "travel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on travel" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "gas stations + EV charging", description: "3x points on gas" },
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "streaming services + phone plans", description: "3x points on streaming and phone plans" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "no elevated grocery earn", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Autograph Journey",
    bank: "Wells Fargo",
    image_url: "",
    annual_fee: 95,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://wellsfargo.com",
    benefits: [
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "hotels", description: "5x points on hotels" },
      { category: "travel", merchant_place: "airlines", reward_rate: 4, reward_type: "points", cap: "airlines", description: "4x points on airlines" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on other travel and restaurants" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "One Key",
    bank: "Wells Fargo",
    image_url: "",
    annual_fee: 0,
    rating: 4.1,
    apply_url: "",
    bank_website: "https://wellsfargo.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 3, reward_type: "points", cap: "", description: "3x OneKeyCash on grocery stores" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "gas stations", description: "3x on gas stations" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x on all other purchases" },
    ],
  },
  {
    name: "Altitude Go",
    bank: "U.S. Bank",
    image_url: "",
    annual_fee: 0,
    rating: 4.6,
    apply_url: "",
    bank_website: "https://usbank.com",
    benefits: [
      { category: "dining", merchant_place: "any", reward_rate: 4, reward_type: "points", cap: "first $2,000 each quarter, then 1x", description: "4x points on dining, takeout and delivery" },
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 2, reward_type: "points", cap: "excludes discount stores, supercenters & wholesale clubs", description: "2x points at grocery stores" },
      { category: "fuel", merchant_place: "any", reward_rate: 2, reward_type: "points", cap: "gas stations + EV charging", description: "2x points on gas" },
      { category: "online", merchant_place: "any", reward_rate: 2, reward_type: "points", cap: "plus $15 annual streaming credit", description: "2x points on streaming services" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Fidelity Rewards Visa",
    bank: "Elan (Fidelity)",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "rewards deposit into a Fidelity account", description: "2% cash back on every purchase, including groceries" },
    ],
  },
  {
    name: "Circle Card",
    bank: "Target",
    image_url: "",
    annual_fee: 0,
    rating: 4.0,
    apply_url: "",
    bank_website: "https://target.com",
    benefits: [
      { category: "grocery", merchant_place: "target", reward_rate: 5, reward_type: "cashback", cap: "Target purchases only", description: "5% off Target purchases, including groceries" },
    ],
  },
  {
    name: "Sam's Club Mastercard",
    bank: "Synchrony",
    image_url: "",
    annual_fee: 0,
    rating: 4.0,
    apply_url: "",
    bank_website: "https://synchrony.com",
    benefits: [
      { category: "fuel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "up to $6,000/yr, then 1%; requires membership", description: "5% cash back on gas anywhere Mastercard is accepted" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining" },
      { category: "grocery", merchant_place: "wholesale", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back at Sam's Club and elsewhere" },
    ],
  },
  {
    name: "Venmo Credit Card",
    bank: "Synchrony",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    bank_website: "https://venmo.com",
    benefits: [
      { category: "grocery", merchant_place: "grocery", reward_rate: 3, reward_type: "cashback", cap: "top spend category each month, auto-detected; 2% on second, 1% rest", description: "3% cash back on your top category (grocery incl. wholesale clubs & delis)" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "second category each month", description: "2% cash back on your second category" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on everything else" },
    ],
  },
  {
    name: "PayPal Cashback Mastercard",
    bank: "Synchrony",
    image_url: "",
    annual_fee: 0,
    rating: 4.2,
    apply_url: "",
    bank_website: "https://paypal.com",
    benefits: [
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "PayPal checkout only", description: "3% cash back checking out with PayPal" },
      { category: "other", merchant_place: "any", reward_rate: 1.5, reward_type: "cashback", cap: "", description: "1.5% cash back on all other purchases" },
    ],
  },
  {
    name: "Family Rewards Mastercard",
    bank: "U.S. Bank (Kroger family)",
    image_url: "",
    annual_fee: 0,
    rating: 4.2,
    apply_url: "",
    bank_website: "",
    benefits: [
      { category: "grocery", merchant_place: "kroger", reward_rate: 5, reward_type: "cashback", cap: "Kroger family stores: Kroger, Fry's, King Soopers, Ralphs, Fred Meyer, QFC, Harris Teeter, Mariano's, Dillons — see terms", description: "Up to 5% cash back on groceries at Kroger-family stores" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
];

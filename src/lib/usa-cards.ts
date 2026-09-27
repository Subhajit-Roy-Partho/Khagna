// Curated USA credit-card catalog for Khagna's /cards matcher.
//
// Researched Sep 2026 from issuer pages + Forbes/CNBC/Bankrate/CNN roundups
// (full source list in docs/07-usa-cards.md). Reward rates + annual fees change —
// re-verify against the issuer page before applying; `apply_url` is set only
// where the issuer URL was directly confirmed, otherwise "".
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
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr per category, then 1%", description: "3% cash back at U.S. supermarkets" },
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr, then 1%", description: "3% cash back on U.S. online retail purchases" },
      { category: "fuel", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "up to $6,000/yr, then 1%", description: "3% cash back at U.S. gas stations" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Gold Card",
    bank: "American Express",
    image_url: "",
    annual_fee: 325,
    rating: 4.7,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 4, reward_type: "points", cap: "up to $25,000/yr, then 1x", description: "4x Membership Rewards points at U.S. supermarkets" },
      { category: "dining", merchant_place: "any", reward_rate: 4, reward_type: "points", cap: "", description: "4x points at restaurants worldwide" },
      { category: "travel", merchant_place: "airlines", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on flights booked directly with airlines" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Savor Cash Rewards",
    bank: "Capital One",
    image_url: "",
    annual_fee: 0,
    rating: 4.7,
    apply_url: "https://www.capitalone.com/credit-cards/savor/",
    benefits: [
      { category: "grocery", merchant_place: "supermarkets", reward_rate: 3, reward_type: "cashback", cap: "excludes superstores like Walmart & Target", description: "3% cash back at grocery stores" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining and entertainment" },
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on popular streaming services" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "booked through Capital One Travel", description: "5% cash back on hotels, vacation rentals & rental cars via Capital One Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Sapphire Preferred",
    bank: "Chase",
    image_url: "",
    annual_fee: 95,
    rating: 4.7,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "online", reward_rate: 3, reward_type: "points", cap: "excludes Target, Walmart & wholesale clubs", description: "3x Ultimate Rewards points on online grocery purchases" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "points", cap: "", description: "3x points on dining and select streaming services" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "points", cap: "booked through Chase Travel", description: "5x points on travel booked through Chase Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "points", cap: "", description: "1x points on all other purchases" },
    ],
  },
  {
    name: "Custom Cash",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
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
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "1% on purchase + 1% on payment", description: "2% cash back on everything (1% when you buy, 1% when you pay)" },
    ],
  },
  {
    name: "Freedom Flex",
    bank: "Chase",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
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
    benefits: [
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining and drugstores" },
      { category: "travel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "booked through Chase Travel", description: "5% cash back on travel booked through Chase Travel" },
      { category: "other", merchant_place: "any", reward_rate: 1.5, reward_type: "cashback", cap: "", description: "1.5% cash back on all other purchases (incl. groceries)" },
    ],
  },
  {
    name: "it Cash Back",
    bank: "Discover",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "rotating quarterly categories, up to $1,500/qtr after activation", description: "5% cash back in rotating quarterly categories (grocery quarters recur)" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "cashback matched in year 1", description: "1% cash back on all other purchases; all year-1 cashback matched" },
    ],
  },
  {
    name: "Customized Cash Rewards",
    bank: "Bank of America",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    benefits: [
      { category: "online", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "choice category, $2,500/qtr combined with grocery, then 1%", description: "3% cash back in your choice category (online shopping covers grocery pickup/delivery)" },
      { category: "grocery", merchant_place: "grocery", reward_rate: 2, reward_type: "cashback", cap: "$2,500/qtr combined, then 1%", description: "2% cash back at grocery stores and wholesale clubs" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Active Cash",
    bank: "Wells Fargo",
    image_url: "",
    annual_fee: 0,
    rating: 4.5,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "", description: "2% cash back on all purchases, including groceries" },
    ],
  },
  {
    name: "Prime Visa",
    bank: "Chase",
    image_url: "",
    annual_fee: 0,
    rating: 4.4,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "whole foods", reward_rate: 5, reward_type: "cashback", cap: "requires Prime membership", description: "5% cash back at Whole Foods Market and Amazon with Prime" },
      { category: "dining", merchant_place: "any", reward_rate: 2, reward_type: "cashback", cap: "", description: "2% cash back at restaurants, gas stations and on transit" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Costco Anywhere Visa",
    bank: "Citi",
    image_url: "",
    annual_fee: 0,
    rating: 4.3,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "wholesale", reward_rate: 2, reward_type: "cashback", cap: "requires Costco membership", description: "2% cash back at Costco and costco.com" },
      { category: "fuel", merchant_place: "any", reward_rate: 4, reward_type: "cashback", cap: "up to $7,000/yr, then 1%", description: "4% cash back on gas and EV charging worldwide" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on restaurants and travel" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
  {
    name: "Circle Card",
    bank: "Target",
    image_url: "",
    annual_fee: 0,
    rating: 4.0,
    apply_url: "",
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
    benefits: [
      { category: "fuel", merchant_place: "any", reward_rate: 5, reward_type: "cashback", cap: "up to $6,000/yr, then 1%; requires membership", description: "5% cash back on gas anywhere Mastercard is accepted" },
      { category: "dining", merchant_place: "any", reward_rate: 3, reward_type: "cashback", cap: "", description: "3% cash back on dining" },
      { category: "grocery", merchant_place: "wholesale", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back at Sam's Club and elsewhere" },
    ],
  },
  {
    name: "Family Rewards Mastercard",
    bank: "U.S. Bank (Kroger family)",
    image_url: "",
    annual_fee: 0,
    rating: 4.2,
    apply_url: "",
    benefits: [
      { category: "grocery", merchant_place: "kroger", reward_rate: 5, reward_type: "cashback", cap: "Kroger family stores: Kroger, Fry's, King Soopers, Ralphs, Fred Meyer, QFC, Harris Teeter, Mariano's, Dillons — see terms", description: "Up to 5% cash back on groceries at Kroger-family stores" },
      { category: "other", merchant_place: "any", reward_rate: 1, reward_type: "cashback", cap: "", description: "1% cash back on all other purchases" },
    ],
  },
];

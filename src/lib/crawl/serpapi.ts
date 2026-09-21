// Google Shopping backfill via SerpApi — the realistic way to get Target,
// Walmart, Costco and Sam's Club prices without fighting their bot walls.
//
// One query returns offers from ALL merchants, so a single call per catalog
// query covers every blocked retailer at once. Free tier = 100 searches/month,
// and identical repeat queries are served from SerpApi cache for free.
//
// Setup: sign up at serpapi.com → API key → SERPAPI_KEY in .env (+ Vercel).
// Without the key every function below returns [] / false — never throws.

import type { RetailerId } from "./types";
import { parsePriceAndUnit } from "./parse-unit";

export type MerchantOffer = {
  retailer: RetailerId;
  merchant: string;
  title: string;
  price: number;
  unit: "kg" | "g" | "lb" | "oz" | "piece";
  sizeText: string;
  imageUrl: string;
  url: string;
};

function key(): string {
  return process.env.SERPAPI_KEY || process.env.SerpApiKey || "";
}

export function serpEnabled(): boolean {
  return key() !== "";
}

// Google Shopping "source" → our retailer anchors. Unlisted merchants are ignored.
const MERCHANT_MAP: { match: RegExp; retailer: RetailerId }[] = [
  { match: /walmart/i, retailer: "walmart" },
  { match: /target/i, retailer: "target" },
  { match: /costco/i, retailer: "costco" },
  { match: /sam'?s\s*club/i, retailer: "samsclub" },
  { match: /fry'?s|kroger/i, retailer: "frys" },
];

export function merchantToRetailer(source: string): RetailerId | null {
  const hit = MERCHANT_MAP.find((m) => m.match.test(source || ""));
  return hit ? hit.retailer : null;
}

type ShoppingResult = {
  title?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
  thumbnail?: string;
  link?: string;
  product_link?: string;
};

export function mapShoppingResults(
  results: ShoppingResult[],
  perMerchantLimit = 2
): MerchantOffer[] {
  const counts: Record<string, number> = {};
  const out: MerchantOffer[] = [];
  for (const r of results) {
    const retailer = merchantToRetailer(r.source ?? "");
    if (!retailer) continue;
    counts[retailer] = (counts[retailer] ?? 0) + 1;
    if (counts[retailer] > perMerchantLimit) continue;
    const price =
      typeof r.extracted_price === "number"
        ? r.extracted_price
        : parseFloat(String(r.price ?? "").replace(/[^0-9.]/g, ""));
    const title = String(r.title ?? "").slice(0, 200);
    if (!title || !isFinite(price) || price <= 0) continue;
    const parsed = parsePriceAndUnit(price, title, "", title);
    if (!parsed) continue;
    out.push({
      retailer,
      merchant: String(r.source),
      title,
      price: parsed.price,
      unit: parsed.unit,
      sizeText: parsed.sizeText,
      imageUrl: String(r.thumbnail ?? "").slice(0, 500),
      url: String(r.link ?? r.product_link ?? "").slice(0, 500),
    });
  }
  return out;
}

export async function fetchShoppingOffers(
  query: string,
  perMerchantLimit = 2
): Promise<{ offers: MerchantOffer[]; error?: string }> {
  const apiKey = key();
  if (!apiKey) return { offers: [] };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: query,
      location: "Tempe,Arizona",
      gl: "us",
      hl: "en",
      api_key: apiKey,
    });
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: controller.signal,
    });
    if (!res.ok) return { offers: [], error: `SerpApi HTTP ${res.status}` };
    const data = await res.json();
    if (data.error) return { offers: [], error: String(data.error).slice(0, 200) };
    const results = (data.shopping_results ?? []) as ShoppingResult[];
    return { offers: mapShoppingResults(results, perMerchantLimit) };
  } catch (e) {
    return { offers: [], error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}

import * as cheerio from "cheerio";
import type { CrawledOffer, RetailerId } from "./types";
import { parsePriceAndUnit } from "./parse-unit";

export type RetailerConfig = {
  id: RetailerId;
  label: string;
  /** Tempe-area zip used for store context. */
  zip: string;
  searchUrl: (query: string) => string;
};

export const RETAILERS: Record<RetailerId, RetailerConfig> = {
  walmart: {
    id: "walmart",
    label: "Walmart",
    zip: "85281",
    searchUrl: (q) => `https://www.walmart.com/search?q=${encodeURIComponent(q)}`,
  },
  samsclub: {
    id: "samsclub",
    label: "Sam's Club",
    zip: "85281",
    searchUrl: (q) => `https://www.samsclub.com/s/${encodeURIComponent(q)}`,
  },
  costco: {
    id: "costco",
    label: "Costco",
    zip: "85281",
    searchUrl: (q) => `https://www.costco.com/s?keyword=${encodeURIComponent(q)}`,
  },
  frys: {
    id: "frys",
    label: "Fry's (Kroger)",
    zip: "85281",
    searchUrl: (q) => `https://www.frysfood.com/search?query=${encodeURIComponent(q)}`,
  },
};

// ---------- extraction cascade ----------
// Strategy 1 (best): JSON-LD Product blocks — structured, includes image + offers.
// Strategy 2: embedded JSON state (__NEXT_DATA__, __APOLLO_STATE__) scanned for
//   objects containing price + name + image keys.
// Strategy 3: DOM fallback with per-retailer selectors.

type RawProduct = {
  name?: string;
  brand?: string;
  price?: number;
  priceText?: string;
  unitPriceText?: string;
  image?: string;
  url?: string;
  availability?: string;
};

function absUrl(retailer: RetailerId, href: string): string {
  if (!href) return "";
  if (/^https?:\/\//i.test(href)) return href;
  const base =
    retailer === "walmart"
      ? "https://www.walmart.com"
      : retailer === "samsclub"
        ? "https://www.samsclub.com"
        : retailer === "costco"
          ? "https://www.costco.com"
          : "https://www.frysfood.com";
  return href.startsWith("/") ? base + href : `${base}/${href}`;
}

function fromJsonLd($: cheerio.CheerioAPI, retailer: RetailerId): RawProduct[] {
  const out: RawProduct[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).text();
      const data = JSON.parse(raw);
      const nodes = Array.isArray(data) ? data : [data, ...(Array.isArray(data?.["@graph"]) ? data["@graph"] : [])];
      for (const n of nodes) {
        const type = Array.isArray(n?.["@type"]) ? n["@type"].join(",") : String(n?.["@type"] ?? "");
        if (!/product/i.test(type)) continue;
        const offers = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const price = parseFloat(String(offers?.price ?? ""));
        if (!isFinite(price)) continue;
        const img = Array.isArray(n.image) ? n.image[0] : n.image;
        out.push({
          name: String(n.name ?? ""),
          brand: typeof n.brand === "object" ? String(n.brand?.name ?? "") : String(n.brand ?? ""),
          price,
          image: typeof img === "object" ? String(img?.url ?? "") : String(img ?? ""),
          url: absUrl(retailer, String(offers?.url ?? n.url ?? "")),
          availability: String(offers?.availability ?? ""),
        });
      }
    } catch {
      /* ignore malformed blocks */
    }
  });
  return out;
}

function fromEmbeddedJson(html: string, retailer: RetailerId): RawProduct[] {
  const out: RawProduct[] = [];
  // Scan large embedded-state blobs for {..."price":4.98...} objects with name+image nearby.
  const PRICE_KEY = /"(?:price|salePrice|currentPrice|regularPrice)"\s*:\s*"?(\d+(?:\.\d{1,2})?)"?/g;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = PRICE_KEY.exec(html)) !== null && out.length < 40) {
    const price = parseFloat(m[1]);
    if (!isFinite(price) || price <= 0 || price > 5000) continue;
    const window = html.slice(Math.max(0, m.index - 1200), m.index + 600);
    const nameM =
      window.match(/"(?:name|title|productName)"\s*:\s*"([^"]{4,140})"/) ||
      window.match(/"(?:name|title)"\s*:\s*"([^"]{4,140})"/);
    if (!nameM || seen.has(nameM[1])) continue;
    seen.add(nameM[1]);
    const imgM = window.match(/"(?:image|imageUrl|thumbnail|heroImage)"\s*:\s*"([^"]+)"/);
    const urlM = window.match(/"(?:productUrl|url|canonicalUrl|link)"\s*:\s*"([^"]+)"/);
    out.push({
      name: nameM[1],
      price,
      image: imgM ? imgM[1].replace(/\\u0026/g, "&") : "",
      url: absUrl(retailer, (urlM ? urlM[1] : "").replace(/\\u0026/g, "&")),
    });
  }
  return out;
}

const DOM_SELECTORS: Record<RetailerId, { card: string; name: string; price: string; img: string; link: string; unitprice?: string }> = {
  walmart: {
    card: '[data-testid="list-view"], [data-item-id]',
    name: 'span[data-automation-id="product-title"], a span',
    price: '[data-automation-id="product-price"], .price-current',
    img: "img",
    link: 'a[link-identifier], a[href*="/ip/"]',
  },
  samsclub: {
    card: ".sc-pc-card, [data-testid='plp-card']",
    name: ".sc-pc-title, h3, h4",
    price: ".Price, [data-testid='price']",
    img: "img",
    link: "a",
  },
  costco: {
    card: ".product-tile, [data-testid='product-tile']",
    name: ".product-tile-description, .description",
    price: ".product-tile-price, .price",
    img: "img",
    link: "a",
  },
  frys: {
    card: '[data-testid^="product-card-"]',
    name: '[data-testid="cart-page-item-description"]',
    price: '[data-testid="product-item-unit-price"]',
    img: '[data-testid="product-image-loaded"], img',
    link: 'a[href^="/p/"]',
    unitprice: '[data-testid="product-item-sizing"]',
  },
};

function fromDom($: cheerio.CheerioAPI, retailer: RetailerId): RawProduct[] {
  const sel = DOM_SELECTORS[retailer];
  const out: RawProduct[] = [];
  $(sel.card).each((_, card) => {
    if (out.length >= 30) return false;
    const c = $(card);
    const name = c.find(sel.name).first().text().trim();
    const priceText = c.find(sel.price).first().text().trim();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));
    if (!name || !isFinite(price)) return;
    const unitPriceText = sel.unitprice ? c.find(sel.unitprice).first().text().trim() : "";
    out.push({
      name,
      price,
      priceText,
      unitPriceText,
      image: c.find(sel.img).first().attr("src") || c.find(sel.img).first().attr("data-src") || "",
      url: absUrl(retailer, c.find(sel.link).first().attr("href") || ""),
    });
  });
  return out;
}

export function extractOffers(
  html: string,
  retailer: RetailerId,
  limit: number
): { offers: Omit<CrawledOffer, "retailer">[]; via: string } {
  const $ = cheerio.load(html);
  let raw: RawProduct[] = [];
  let via = "none";
  raw = fromJsonLd($, retailer);
  if (raw.length) via = "json-ld";
  if (!raw.length) {
    raw = fromEmbeddedJson(html, retailer);
    if (raw.length) via = "embedded-json";
  }
  if (!raw.length) {
    raw = fromDom($, retailer);
    if (raw.length) via = "dom";
  }
  const offers = raw.slice(0, limit).flatMap((r) => {
    const parsed = parsePriceAndUnit(r.price ?? NaN, r.priceText ?? "", r.unitPriceText ?? "", r.name ?? "");
    if (!parsed) return [];
    return [
      {
        url: r.url || "",
        title: (r.name || "").slice(0, 200),
        brand: (r.brand || "").slice(0, 80),
        price: parsed.price,
        unit: parsed.unit,
        sizeText: parsed.sizeText,
        imageUrl: (r.image || "").slice(0, 500),
        inStock: !/outofstock|out_of_stock|soldout/i.test(r.availability ?? ""),
        via,
      },
    ];
  });
  return { offers, via };
}

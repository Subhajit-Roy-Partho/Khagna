// Parse retailer price/size text into our normalized {price, unit, sizeText}.
// Handles: "$4.98", "$0.62/oz", "$3.99/lb", "5 lb bag", "12 ct", "1 gal".

export type ParsedPrice = {
  price: number;
  unit: "kg" | "g" | "lb" | "oz" | "piece";
  sizeText: string;
};

const UNIT_WORD: Record<string, ParsedPrice["unit"]> = {
  kg: "kg",
  kilogram: "kg",
  kilograms: "kg",
  g: "g",
  gram: "g",
  grams: "g",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  ct: "piece",
  count: "piece",
  pk: "piece",
  pack: "piece",
  each: "piece",
  ea: "piece",
  gal: "piece",
  gallon: "piece",
  gallons: "piece",
  dozen: "piece",
  "fl oz": "piece", // fluid ounce (volume) — compared per-package, not by weight
  "floz": "piece",
};

const PER_UNIT_RE =
  /\$?\s*[\d.]+\s*(?:\/|per)\s*(fl\s*oz|kg|kilograms?|grams?|lbs?|pounds?|ounces?|oz|ct|count|packs?|each|gall?ons?|dozen|\bg\b)/i;

export function parsePriceAndUnit(
  price: number,
  priceText: string,
  unitPriceText: string,
  title: string
): ParsedPrice | null {
  if (!isFinite(price) || price <= 0 || price > 100000) return null;
  // Prefer explicit per-unit markers: "$0.62/oz", "62¢/oz", "$3.99 per lb", "$0.08/fl oz"
  const combined = `${unitPriceText} ${priceText} ${title}`;
  const perM = combined.match(PER_UNIT_RE);
  const perKey = perM ? perM[1].toLowerCase().replace(/\s+/g, " ") : "";
  let unit: ParsedPrice["unit"] | null = perKey ? (UNIT_WORD[perKey] ?? UNIT_WORD[perKey.replace(/s$/, "")] ?? null) : null;
  // Otherwise infer from pack size in the title: "5 lb", "12 ct", "1 gal"
  const sizeM = title.match(/(\d+(?:\.\d+)?)\s*(kg|kilograms?|grams?|lbs?|pounds?|ounces?|oz|ct|count|packs?|each|\bea\b|gall?ons?|dozen)\b/i);
  if (!unit && sizeM) unit = UNIT_WORD[sizeM[2].toLowerCase()] ?? null;
  // Unit-priced produce ("$0.68 each") or dozen/ct items are per-piece.
  if (!unit && /each|\bea\b|per (count|each)|dozen|\bct\b/i.test(combined)) unit = "piece";
  // Fallback: weight items assumed per-package price in lb is unsafe; keep the
  // quoted unit only when we found one, else treat as per-piece package price.
  if (!unit) unit = "piece";
  const sizeText = (sizeM ? sizeM[0] : "").slice(0, 40);
  return { price: +price.toFixed(2), unit, sizeText };
}

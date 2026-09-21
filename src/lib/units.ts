// Weight units normalized to price-per-kg for fair comparison.
// piece stays as price-per-piece (not comparable to weight, sorted separately).

export const WEIGHT_UNITS = ["kg", "g", "lb", "oz"] as const;
export const ALL_UNITS = ["kg", "g", "lb", "oz", "piece"] as const;
export type Unit = (typeof ALL_UNITS)[number];

// grams per unit
const TO_GRAMS: Record<string, number> = {
  kg: 1000,
  g: 1,
  lb: 453.59237,
  oz: 28.349523125,
};

export function isWeightUnit(u: string) {
  return (WEIGHT_UNITS as readonly string[]).includes(u);
}

// Convert a price quoted in `from` unit to price in `to` unit.
export function convertPrice(price: number, from: Unit | string, to: Unit | string): number {
  if (from === to) return price;
  if (from === "piece" || to === "piece") return NaN; // can't convert piece <-> weight
  const gFrom = TO_GRAMS[from];
  const gTo = TO_GRAMS[to];
  if (!gFrom || !gTo) return NaN;
  // price per gFrom-grams -> price per gTo-grams
  return (price / gFrom) * gTo;
}

// Normalized price per kg (for sorting weight items)
export function pricePerKg(price: number, unit: string): number {
  if (unit === "piece") return NaN;
  const g = TO_GRAMS[unit];
  if (!g) return NaN;
  return (price / g) * 1000;
}

export function formatPrice(price: number, currency = "$"): string {
  if (!isFinite(price)) return "—";
  return `${currency}${price.toFixed(2)}`;
}

export const CITIES = [
  "New York",
  "Chicago",
  "Houston",
  "San Francisco",
  "Los Angeles",
  "Kolkata",
  "Delhi",
  "Mumbai",
  "Dubai",
  "Sharjah",
  "Abu Dhabi",
  "Doha",
  "Riyadh",
  "Jeddah",
];

// approx city centers for map default
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "New York": { lat: 40.7128, lng: -74.006 },
  Chicago: { lat: 41.8781, lng: -87.6298 },
  Houston: { lat: 29.7604, lng: -95.3698 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "Los Angeles": { lat: 34.0522, lng: -118.2437 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Sharjah: { lat: 25.3463, lng: 55.4209 },
  "Abu Dhabi": { lat: 24.4539, lng: 54.3773 },
  Doha: { lat: 25.2854, lng: 51.531 },
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Jeddah: { lat: 21.4858, lng: 39.1925 },
};

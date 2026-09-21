export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function milesFromKm(km: number) {
  return km * 0.621371;
}

// Basket optimizer:
// Given item options (per item: list of {storeId, price, ...}), find assignment minimizing
// total price + travel penalty. Travel penalty = extra stores visited * perStopCost + distance.
// Simple greedy + exact search for small baskets (<=6 items, <=8 stores).
export type BasketOption = {
  itemId: number;
  itemName: string;
  qty: number; // in display unit, already normalized comparison uses unitPrice
  storeId: number;
  storeName: string;
  unitPrice: number; // price in display unit
  lineTotal: number;
  distanceKm: number;
  isOnline: boolean;
};

export type BasketPlan = {
  assignment: BasketOption[];
  subtotal: number;
  storeCount: number;
  travelKm: number;
  score: number;
};

export function optimizeBasket(
  perItemOptions: BasketOption[][],
  userLat: number,
  userLng: number,
  storeCoords: Map<number, { lat: number; lng: number }>,
  opts: { perStopPenalty?: number; maxStores?: number } = {}
): BasketPlan[] {
  const perStopPenalty = opts.perStopPenalty ?? 2; // $ equivalent per extra store
  const plans: BasketPlan[] = [];

  // Strategy 1: cheapest per item independently
  const cheapest: BasketOption[] = perItemOptions
    .map((o) => o.slice().sort((a, b) => a.lineTotal - b.lineTotal)[0])
    .filter(Boolean);
  if (cheapest.length) plans.push(scorePlan(cheapest));

  // Strategy 2: single-store best (minimize travel)
  const storeIds = [...new Set(perItemOptions.flat().map((o) => o.storeId))];
  for (const sid of storeIds) {
    const assignment: BasketOption[] = [];
    let ok = true;
    for (const options of perItemOptions) {
      const found = options
        .filter((o) => o.storeId === sid)
        .sort((a, b) => a.lineTotal - b.lineTotal)[0];
      if (!found) {
        ok = false;
        break;
      }
      assignment.push(found);
    }
    if (ok) plans.push(scorePlan(assignment));
  }

  // Strategy 3: two-store combos (bounded)
  const topStores = storeIds.slice(0, 8);
  for (let i = 0; i < topStores.length; i++) {
    for (let j = i + 1; j < topStores.length; j++) {
      const allowed = new Set([topStores[i], topStores[j]]);
      const assignment: BasketOption[] = [];
      let ok = true;
      for (const options of perItemOptions) {
        const found = options
          .filter((o) => allowed.has(o.storeId))
          .sort((a, b) => a.lineTotal - b.lineTotal)[0];
        if (!found) {
          ok = false;
          break;
        }
        assignment.push(found);
      }
      if (ok) plans.push(scorePlan(assignment));
    }
  }

  function scorePlan(assignment: BasketOption[]): BasketPlan {
    const subtotal = assignment.reduce((s, o) => s + o.lineTotal, 0);
    const stores = new Set(assignment.map((o) => o.storeId));
    let travelKm = 0;
    for (const sid of stores) {
      const c = storeCoords.get(sid);
      if (c && userLat && userLng) {
        travelKm += 2 * haversineKm(userLat, userLng, c.lat, c.lng); // round trip approx per store
      }
    }
    // crude: visiting N stores => travel divided? keep sum, plus penalty
    const score = subtotal + (stores.size - 1) * perStopPenalty + travelKm * 0.3;
    return { assignment, subtotal, storeCount: stores.size, travelKm, score };
  }

  // dedupe + sort by score
  const seen = new Set<string>();
  const uniq: BasketPlan[] = [];
  for (const p of plans.sort((a, b) => a.score - b.score)) {
    const key = p.assignment.map((a) => `${a.itemId}@${a.storeId}`).sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(p);
  }
  return uniq.slice(0, 5);
}

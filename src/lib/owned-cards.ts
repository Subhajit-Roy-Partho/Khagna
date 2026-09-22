// "My cards" persistence (per-device localStorage).
"use client";

const OWNED_KEY = "khagna:owned";
const FILTER_KEY = "khagna:ownedOnly";

export function getOwned(): number[] {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((n) => Number.isFinite(Number(n))).map(Number) : [];
  } catch {
    return [];
  }
}

export function toggleOwned(id: number): number[] {
  const cur = new Set(getOwned());
  if (cur.has(id)) cur.delete(id);
  else cur.add(id);
  const next = [...cur];
  try {
    localStorage.setItem(OWNED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

// Filter defaults to ON (show only owned cards); user can switch it off.
export function getOwnedOnly(): boolean {
  try {
    const raw = localStorage.getItem(FILTER_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setOwnedOnly(v: boolean) {
  try {
    localStorage.setItem(FILTER_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}

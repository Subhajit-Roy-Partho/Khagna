// User-settable default location (localStorage). Falls back to Tempe, AZ.
"use client";

export type LocPref = { lat: number; lng: number; city: string };

export const TEMPE_DEFAULT: LocPref = { lat: 33.4255, lng: -111.94, city: "Tempe" };

const KEY = "khagna:loc";

export function loadLoc(): LocPref {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<LocPref>;
      if (isFinite(Number(p.lat)) && isFinite(Number(p.lng))) {
        return { lat: Number(p.lat), lng: Number(p.lng), city: String(p.city || "Tempe") };
      }
    }
  } catch {
    /* ignore */
  }
  return { ...TEMPE_DEFAULT };
}

export function saveLoc(p: LocPref) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

export function clearLoc() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

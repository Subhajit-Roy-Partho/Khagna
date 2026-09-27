"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CITIES, CITY_COORDS } from "@/lib/units";
import { loadLoc, saveLoc, clearLoc } from "@/lib/location-pref";
import { getOwned, getOwnedOnly, setOwnedOnly } from "@/lib/owned-cards";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  function readLoc() {
    try {
      return loadLoc();
    } catch {
      return { lat: 33.4255, lng: -111.94, city: "Tempe" };
    }
  }
  const [city, setCity] = useState(() => readLoc().city);
  const [lat, setLat] = useState(() => String(readLoc().lat));
  const [lng, setLng] = useState(() => String(readLoc().lng));
  const [ownedCount, setOwnedCount] = useState(() => {
    try {
      return getOwned().length;
    } catch {
      return 0;
    }
  });
  const [ownedOnly, setOwnedOnlyState] = useState(() => {
    try {
      return getOwnedOnly();
    } catch {
      return true;
    }
  });
  const [msg, setMsg] = useState("");

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  }

  function pickCity(name: string) {
    setCity(name);
    const c = CITY_COORDS[name];
    if (c) {
      setLat(String(c.lat));
      setLng(String(c.lng));
    }
  }

  function saveLocation() {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!isFinite(la) || !isFinite(ln)) {
      flash("Enter valid numbers for lat/lng.");
      return;
    }
    saveLoc({ lat: la, lng: ln, city });
    flash("Default location saved ✓");
  }

  function resetLocation() {
    clearLoc();
    pickCity("Tempe");
    flash("Location reset to Tempe.");
  }

  function clearOwned() {
    try {
      localStorage.removeItem("khagna:owned");
    } catch {
      /* ignore */
    }
    setOwnedCount(0);
    flash("My-cards list cleared.");
  }

  function flipOwnedOnly(v: boolean) {
    setOwnedOnly(v);
    setOwnedOnlyState(v);
  }

  if (status === "loading") {
    return <p className="rounded-2xl border bg-white p-4 text-sm text-gray-500">Loading…</p>;
  }
  const u = session?.user as { name?: string; image?: string; email?: string } | undefined;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <h1 className="text-xl font-extrabold">Settings</h1>
      {msg && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{msg}</p>}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">👤 Account</h2>
        {u ? (
          <div className="mt-2 flex items-center gap-3">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar hotlink
              <img src={u.image} alt="" className="h-12 w-12 rounded-full border" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                {(u.name || u.email || "?")[0]?.toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.name || "Khagna user"}</p>
              {u.email && <p className="truncate text-sm text-gray-500">{u.email}</p>}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="ml-auto rounded-full border px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            You&apos;re browsing as a guest.{" "}
            <button onClick={() => router.push("/signin")} className="font-bold text-emerald-700 hover:underline">
              Sign in
            </button>{" "}
            to correct prices, comment, and add stores & cards.
          </p>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">📍 Default location</h2>
        <p className="text-xs text-gray-500">Used by /stores for distance + map. Stored on this device only.</p>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <label className="text-xs">City
            <select value={city} onChange={(e) => pickCity(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs">Latitude
            <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
          </label>
          <label className="text-xs">Longitude
            <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-2 flex gap-2 text-sm">
          <button onClick={saveLocation} className="rounded bg-emerald-600 px-4 py-2 font-bold text-white">Save default</button>
          <button onClick={resetLocation} className="rounded border px-4 py-2 font-semibold">↺ Reset to Tempe</button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">💳 My cards</h2>
        <p className="text-xs text-gray-500">Per-device list, managed from the /cards page.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-800">{ownedCount} marked mine</span>
          <label className="flex cursor-pointer items-center gap-2 font-semibold">
            <input type="checkbox" checked={ownedOnly} onChange={(e) => flipOwnedOnly(e.target.checked)} className="accent-emerald-600" />
            Only my cards
          </label>
          <Link href="/cards" className="rounded border px-3 py-1.5 font-semibold hover:bg-emerald-50">Manage →</Link>
          <button onClick={clearOwned} className="rounded border px-3 py-1.5 font-semibold text-red-600 hover:bg-red-50">Clear</button>
        </div>
      </div>
    </motion.div>
  );
}

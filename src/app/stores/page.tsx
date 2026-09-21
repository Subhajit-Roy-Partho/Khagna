"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { CITIES, CITY_COORDS, ALL_UNITS, convertPrice, pricePerKg } from "@/lib/units";

const StoreMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

type ItemRow = {
  item: { id: number; name_en: string; name_bn: string; name_alt: string; category: string; image_url: string; base_unit: string };
  options: Record<string, unknown>[];
  displayUnit: string;
};

export default function StoresPage() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("All");
  const [radiusKm, setRadiusKm] = useState(25);
  const [unit, setUnit] = useState("kg");
  const [online, setOnline] = useState("include");
  const [lat, setLat] = useState(CITY_COORDS["Chicago"].lat);
  const [lng, setLng] = useState(CITY_COORDS["Chicago"].lng);
  const [data, setData] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [correcting, setCorrecting] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetch("/api/init", { method: "POST" }).catch(() => {});
      if (!cancelled) await search();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search() {
    setLoading(true);
    try {
      const sp = new URLSearchParams({
        q, city, radiusKm: String(radiusKm), unit, online,
        lat: isFinite(lat) ? String(lat) : "",
        lng: isFinite(lng) ? String(lng) : "",
      });
      const r = await fetch(`/api/items?${sp}`);
      const j = await r.json();
      if (j.ok) setData(j.results);
    } finally {
      setLoading(false);
    }
  }

  // (initial search runs inside the mount effect above)

  function useMyLocation() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((p) => {
      setLat(p.coords.latitude); setLng(p.coords.longitude);
    });
  }

  const mapStores = useMemo(() => {
    const m = new Map<number, { id: number; name: string; lat: number; lng: number; city: string }>();
    for (const r of data) for (const o of r.options as { store_id: number; store_name: string; store_lat: number; store_lng: number; store_city: string }[]) {
      m.set(Number(o.store_id), { id: Number(o.store_id), name: String(o.store_name), lat: Number(o.store_lat), lng: Number(o.store_lng), city: String(o.store_city) });
    }
    return [...m.values()];
  }, [data]);

  async function submitCorrection(opt: Record<string, unknown>, itemId: number) {
    const key = String(opt.id);
    const newPrice = parseFloat(correcting[key] || "");
    if (!isFinite(newPrice)) return alert("Enter a valid price");
    const r = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: itemId, store_id: Number(opt.store_id), price: newPrice, unit: String(opt.unit), is_online: Number(opt.is_online), comment: "user correction" }),
    });
    const j = await r.json();
    alert(j.queued ? "Queued for review (fresh scrape wins)." : "Price updated. Thanks!");
    search();
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <h1 className="text-xl font-extrabold">Compare prices near you</h1>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <label className="text-sm">Search item (English / বাংলা / alt)
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. basmati, মসুর, ilish" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">City
          <select value={city} onChange={(e) => {
            setCity(e.target.value);
            const c = CITY_COORDS[e.target.value];
            if (c) { setLat(c.lat); setLng(c.lng); }
          }} className="mt-1 w-full rounded border px-3 py-2">
            <option>All</option>
            {CITIES.map((c) => <option key={c}>{c}</option>)}
            <option>Online</option>
          </select>
        </label>
        <label className="text-sm">Display unit + converter
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
            {ALL_UNITS.map((u) => <option key={u} value={u}>{u === "piece" ? "per piece" : `per ${u}`}</option>)}
          </select>
        </label>
        <label className="text-sm">Radius: {radiusKm} km
          <input type="range" min={2} max={100} value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full" />
        </label>
        <label className="text-sm">Store vs online
          <select value={online} onChange={(e) => setOnline(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
            <option value="include">Both</option>
            <option value="only">Online only</option>
            <option value="exclude">Physical stores only</option>
          </select>
        </label>
        <div className="flex items-end gap-2 text-sm">
          <button onClick={useMyLocation} className="rounded border px-3 py-2">📍 Use my location</button>
          <button onClick={search} className="rounded bg-emerald-600 px-4 py-2 font-bold text-white">{loading ? "…" : "Search"}</button>
        </div>
        <p className="text-xs text-gray-500 md:col-span-3">Lat {isFinite(lat) ? lat.toFixed(3) : "—"}, Lng {isFinite(lng) ? lng.toFixed(3) : "—"} · scraped prices show a 🤖 badge and rank first.</p>
      </div>

      <StoreMap userLat={lat} userLng={lng} radiusKm={radiusKm} stores={mapStores} />

      <div className="grid gap-4">
        {data.map(({ item, options }) => (
          <div key={item.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-bold">{item.name_en}</h2>
              {item.name_bn && <span className="text-sm text-gray-600">{item.name_bn}</span>}
              <span className="text-xs text-gray-400">{item.category} · {item.name_alt}</span>
            </div>
            {options.length === 0 && <p className="mt-2 text-sm text-gray-500">No stores in range.</p>}
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="text-left text-xs text-gray-500">
                  <th className="py-1">Item</th><th>Store</th><th>Dist</th><th>Quoted</th><th>Per {unit}</th><th>Quality</th><th>Stock</th><th>Src</th><th>Correct</th>
                </tr></thead>
                <tbody>
                  {(options as Record<string, unknown>[]).map((o) => {
                    const quoted = Number(o.price);
                    const conv = o.unit === unit ? quoted : convertPrice(quoted, String(o.unit), unit);
                    const dist = Number(o.distanceKm);
                    return (
                      <tr key={String(o.id)} className="border-t">
                        <td className="py-2 pr-2">
                          {String(o.image_url || "") ? (
                            // Intentional plain <img>: retailer CDN hotlinks aren't in
                            // next/image remotePatterns (see docs/02-architecture.md).
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={String(o.image_url)}
                              alt={item.name_en}
                              loading="lazy"
                              className="h-12 w-12 rounded-lg border object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <span className="grid h-12 w-12 place-items-center rounded-lg bg-zinc-100 text-lg">🛒</span>
                          )}
                        </td>
                        <td className="py-2 pr-2 font-medium">{String(o.store_name)} <span className="text-xs text-gray-400">{Number(o.is_online) ? "· online" : `· ${String(o.store_city)}`}</span></td>
                        <td>{Number(o.store_lat) === 0 ? "online" : isFinite(dist) ? `${dist.toFixed(1)} km` : "—"}</td>
                        <td>${quoted.toFixed(2)}/{String(o.unit)}</td>
                        <td className="font-bold text-emerald-700">{isFinite(conv) ? `$${conv.toFixed(2)}` : `$${quoted.toFixed(2)}/pc`}</td>
                        <td>{"★".repeat(Number(o.quality) || 3)}</td>
                        <td><span className={`rounded px-1.5 py-0.5 text-xs ${String(o.stock_level).includes("out") || String(o.stock_level).includes("bad") ? "bg-red-100 text-red-700" : String(o.stock_level).includes("low") ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>{String(o.stock_level)}</span></td>
                        <td>{String(o.source) === "scraped" ? "🤖" : "👤"}</td>
                        <td>
                          <div className="flex gap-1">
                            <input placeholder="$" value={correcting[String(o.id)] || ""} onChange={(e) => setCorrecting({ ...correcting, [String(o.id)]: e.target.value })} className="w-16 rounded border px-1 py-0.5" />
                            <button onClick={() => submitCorrection(o, item.id)} className="rounded bg-zinc-900 px-2 py-0.5 text-xs text-white">Fix</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Sorted cheapest-first in {unit} (per-kg normalized for weight units). {String((options[0] as Record<string, unknown> | undefined)?.source) === "scraped" ? "Top result is auto-scraped." : ""} Best per-kg ref: {(() => { const v = (options[0] as Record<string, unknown> | undefined); return v ? pricePerKg(Number(v.price), String(v.unit)).toFixed(2) : "—"; })()}/kg</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CITY_COORDS, convertPrice } from "@/lib/units";
import { haversineKm, optimizeBasket, type BasketOption } from "@/lib/geo";

type Found = { item: { id: number; name_en: string }; options: Record<string, unknown>[] };

export default function BasketPage() {
  const [lines, setLines] = useState<{ q: string; qty: number; unit: string }[]>([
    { q: "basmati", qty: 2, unit: "kg" },
    { q: "masoor", qty: 1, unit: "kg" },
  ]);
  const [lat, setLat] = useState(CITY_COORDS["Chicago"].lat);
  const [lng, setLng] = useState(CITY_COORDS["Chicago"].lng);
  const [plans, setPlans] = useState<ReturnType<typeof optimizeBasket>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/init", { method: "POST" }).catch(() => {}); }, []);

  function setLine(i: number, patch: Partial<{ q: string; qty: number; unit: string }>) {
    setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  async function optimize() {
    setLoading(true);
    try {
      const perItem: BasketOption[][] = [];
      const storeCoords = new Map<number, { lat: number; lng: number }>();
      for (const line of lines) {
        if (!line.q.trim()) continue;
        const sp = new URLSearchParams({ q: line.q, lat: String(lat), lng: String(lng), radiusKm: "200", unit: line.unit });
        const r = await fetch(`/api/items?${sp}`);
        const j = await r.json();
        const found: Found[] = j.results || [];
        const best = found[0];
        if (!best) continue;
        const opts: BasketOption[] = (best.options as Record<string, unknown>[]).map((o) => {
          const quoted = Number(o.price);
          const conv = String(o.unit) === line.unit ? quoted : convertPrice(quoted, String(o.unit), line.unit);
          const unitPrice = isFinite(conv) ? conv : quoted;
          storeCoords.set(Number(o.store_id), { lat: Number(o.store_lat), lng: Number(o.store_lng) });
          const dist = Number(o.store_lat) === 0 ? 0 : haversineKm(lat, lng, Number(o.store_lat), Number(o.store_lng));
          return {
            itemId: best.item.id, itemName: best.item.name_en, qty: line.qty,
            storeId: Number(o.store_id), storeName: String(o.store_name),
            unitPrice, lineTotal: +(unitPrice * line.qty).toFixed(2),
            distanceKm: dist, isOnline: Number(o.is_online) === 1,
          };
        }).filter((o) => isFinite(o.unitPrice)).slice(0, 6);
        if (opts.length) perItem.push(opts);
      }
      setPlans(optimizeBasket(perItem, lat, lng, storeCoords));
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <h1 className="text-xl font-extrabold">Basket optimizer — least cost, least travel</h1>
      <div className="rounded-2xl border bg-white p-4 grid gap-3">
        {lines.map((l, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            <input value={l.q} onChange={(e) => setLine(i, { q: e.target.value })} placeholder="item (e.g. basmati)" className="flex-1 min-w-[140px] rounded border px-3 py-2 text-sm" />
            <input type="number" min={0.1} step={0.1} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} className="w-20 rounded border px-2 py-2 text-sm" />
            <select value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })} className="rounded border px-2 py-2 text-sm">
              {["kg", "g", "lb", "oz", "piece"].map((u) => <option key={u}>{u}</option>)}
            </select>
            <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="rounded border px-2 text-sm">✕</button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setLines([...lines, { q: "", qty: 1, unit: "kg" }])} className="rounded border px-3 py-2 text-sm">+ Add item</button>
          <button onClick={() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => { setLat(p.coords.latitude); setLng(p.coords.longitude); }); }} className="rounded border px-3 py-2 text-sm">📍 My location</button>
          <button onClick={optimize} className="rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white">{loading ? "Optimizing…" : "Optimize"}</button>
        </div>
        <p className="text-xs text-gray-500">Location: {lat.toFixed(3)}, {lng.toFixed(3)} — travel cost ≈ $0.30/km + $2 per extra store stop.</p>
      </div>

      {plans.map((p, i) => (
        <div key={i} className={`rounded-2xl border p-4 ${i === 0 ? "bg-emerald-50 border-emerald-300" : "bg-white"}`}>
          <h2 className="font-bold">{i === 0 ? "🏆 Best plan" : `Option ${i + 1}`} — ${p.subtotal.toFixed(2)} · {p.storeCount} store{p.storeCount > 1 ? "s" : ""} · ~{p.travelKm.toFixed(1)} km round-trip</h2>
          <ul className="mt-2 text-sm space-y-1">
            {p.assignment.map((a, j) => (
              <li key={j}>• {a.qty} {lines[j]?.unit} <b>{a.itemName}</b> @ {a.storeName} — ${a.lineTotal.toFixed(2)} {a.isOnline ? "(online)" : `(${a.distanceKm.toFixed(1)} km)`}</li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
}

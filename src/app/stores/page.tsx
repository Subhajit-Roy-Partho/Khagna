"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CITIES,
  CITY_COORDS,
  UNIT_GROUPS,
  UNIT_LABELS,
  DEFAULT_DISPLAY_UNIT,
  convertPrice,
  pricePerKg,
  unitSystem,
} from "@/lib/units";
import { loadLoc, saveLoc, clearLoc } from "@/lib/location-pref";

const StoreMap = dynamic(() => import("@/components/StoreMap"), { ssr: false });

type ItemRow = {
  item: { id: number; name_en: string; name_bn: string; name_alt: string; category: string; image_url: string; base_unit: string };
  options: Record<string, unknown>[];
  displayUnit: string;
};

type StoreRow = {
  id: number;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  is_online: number;
};

const STOCK_OPTS = ["in_stock", "low_stock", "out_of_stock", "bad_product"];
const ITEM_CATEGORIES = ["grocery", "produce", "dairy", "meat", "fish", "bakery", "spices", "frozen", "beverages", "household", "other"];

function UnitSelect({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  className?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className ?? "mt-1 w-full rounded border px-3 py-2"}>
      {UNIT_GROUPS.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.units.map((u) => (
            <option key={u} value={u}>
              {u === "piece" ? "per piece" : `per ${UNIT_LABELS[u] ?? u}`}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function UnitConverter() {
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState<string>("lb");
  const [to, setTo] = useState<string>(DEFAULT_DISPLAY_UNIT);
  const val = parseFloat(amount);
  const out = isFinite(val) ? convertPrice(val, from, to) : NaN;
  const perKg = isFinite(val) ? pricePerKg(val, from) : NaN;
  return (
    <div className="rounded-2xl border bg-white p-4">
      <h2 className="font-bold">⚖️ Unit converter <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800">SI default</span></h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Prices are compared per-kg. Type a US quote (lb/oz) to see its SI price, or convert any way you like.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <label className="text-xs">Amount ($)
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="e.g. 2.99" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
        </label>
        <label className="text-xs">From
          <UnitSelect value={from} onChange={setFrom} className="mt-1 w-full rounded border px-2 py-2 text-sm" />
        </label>
        <button
          title="Swap units"
          onClick={() => { setFrom(to); setTo(from); }}
          className="self-end rounded border px-2 py-2 text-sm"
        >⇄</button>
        <label className="text-xs">To
          <UnitSelect value={to} onChange={setTo} className="mt-1 w-full rounded border px-2 py-2 text-sm" />
        </label>
        <div className="self-end rounded bg-emerald-50 px-2 py-2 text-sm font-bold text-emerald-800">
          {isFinite(out) ? `$${out.toFixed(2)}/${to}` : "—"}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        {isFinite(perKg) ? <>= ${perKg.toFixed(2)}/kg reference · </> : null}
        {from === to ? "Same unit." : unitSystem(to) === "si" ? "Converted to SI ✓" : "Tip: switch “To” to kg/g for the SI reference."}
        {from === "piece" || to === "piece" ? " Piece ↔ weight can't convert." : ""}
      </p>
    </div>
  );
}

export default function StoresPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("Tempe");
  const [radiusKm, setRadiusKm] = useState(25);
  // SI default: kg. Users can switch to g (SI) or lb/oz (US) via the grouped
  // select + Metric/US quick toggle below.
  const [unit, setUnit] = useState<string>(DEFAULT_DISPLAY_UNIT);
  const [online, setOnline] = useState("include");
  const [lat, setLat] = useState(() => loadLoc().lat);
  const [lng, setLng] = useState(() => loadLoc().lng);
  const [data, setData] = useState<ItemRow[]>([]);
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  // inline click-to-correct: {priceId, field} + draft value
  const [editing, setEditing] = useState<{ id: string; field: "price" | "quality" | "stock" } | null>(null);
  const [draft, setDraft] = useState("");
  const [locMsg, setLocMsg] = useState("");

  // ---- Add-inventory form state ----
  const [showAdd, setShowAdd] = useState(false);
  const [itemMode, setItemMode] = useState<"existing" | "new">("existing");
  const [storeMode, setStoreMode] = useState<"existing" | "new">("existing");
  const [invItemId, setInvItemId] = useState("");
  const [invStoreId, setInvStoreId] = useState("");
  const [invName, setInvName] = useState("");
  const [invCategory, setInvCategory] = useState("grocery");
  const [invBaseUnit, setInvBaseUnit] = useState<string>(DEFAULT_DISPLAY_UNIT);
  const [invStoreName, setInvStoreName] = useState("");
  const [invStoreCity, setInvStoreCity] = useState("Tempe");
  const [invPrice, setInvPrice] = useState("");
  const [invUnit, setInvUnit] = useState<string>(DEFAULT_DISPLAY_UNIT);
  const [invQuality, setInvQuality] = useState("3");
  const [invStock, setInvStock] = useState("in_stock");
  const [invNote, setInvNote] = useState("");
  const [invOnline, setInvOnline] = useState(false);
  const [invMsg, setInvMsg] = useState("");
  const [invBusy, setInvBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetch("/api/init", { method: "POST" }).catch(() => {});
      if (!cancelled) {
        await Promise.all([search(), loadStores()]);
      }
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

  async function loadStores() {
    try {
      const r = await fetch("/api/stores");
      const j = await r.json();
      if (j.ok) setStores(j.stores as StoreRow[]);
    } catch {
      /* ignore */
    }
  }

  // (initial search runs inside the mount effect above)

  function useMyLocation() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((p) => {
      setLat(p.coords.latitude); setLng(p.coords.longitude);
    });
  }

  function saveDefault() {
    saveLoc({ lat, lng, city });
    setLocMsg("Saved as your default location ✓");
    setTimeout(() => setLocMsg(""), 2500);
  }

  const mapStores = useMemo(() => {
    const m = new Map<number, { id: number; name: string; lat: number; lng: number; city: string }>();
    for (const r of data) for (const o of r.options as { store_id: number; store_name: string; store_lat: number; store_lng: number; store_city: string }[]) {
      m.set(Number(o.store_id), { id: Number(o.store_id), name: String(o.store_name), lat: Number(o.store_lat), lng: Number(o.store_lng), city: String(o.store_city) });
    }
    return [...m.values()];
  }, [data]);

  const itemOptions = useMemo(() => data.map((r) => r.item), [data]);

  function startEdit(id: string, field: "price" | "quality" | "stock", current: string) {
    if (!session?.user) {
      if (confirm("Sign in to correct prices. Go to sign-in?")) router.push("/signin");
      return;
    }
    setEditing({ id, field });
    setDraft(current);
  }

  async function saveEdit(opt: Record<string, unknown>, itemId: number) {
    if (!editing) return;
    const payload: Record<string, unknown> = {
      item_id: itemId,
      store_id: Number(opt.store_id),
      price: Number(opt.price),
      unit: String(opt.unit),
      quality: Number(opt.quality) || 3,
      stock_level: String(opt.stock_level),
      is_online: Number(opt.is_online),
      comment: "inline correction",
    };
    if (editing.field === "price") {
      const v = parseFloat(draft);
      if (!isFinite(v) || v <= 0) return alert("Enter a valid price");
      payload.price = v;
    } else if (editing.field === "quality") {
      payload.quality = Math.min(5, Math.max(1, parseInt(draft, 10) || 3));
    } else {
      if (!STOCK_OPTS.includes(draft)) return alert("Pick a valid stock status");
      payload.stock_level = draft;
    }
    const r = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) {
      router.push("/signin");
      return;
    }
    setEditing(null);
    alert(j.queued ? "Queued for review (fresh scrape wins)." : "Saved — thanks!");
    search();
  }

  // ---- Add inventory (new price entry, incl. new item / new store) ----
  const invPreview = (() => {
    const v = parseFloat(invPrice);
    if (!isFinite(v) || v <= 0) return null;
    const inDisplay = invUnit === unit ? v : convertPrice(v, invUnit, unit);
    return { inDisplay, perKg: pricePerKg(v, invUnit) };
  })();

  async function submitInventory() {
    if (!session?.user) {
      if (confirm("Sign in to add inventory. Go to sign-in?")) router.push("/signin");
      return;
    }
    const price = parseFloat(invPrice);
    if (!isFinite(price) || price <= 0) return alert("Enter a valid price (e.g. 3.49)");
    let itemId = invItemId ? Number(invItemId) : NaN;
    let storeId = invStoreId ? Number(invStoreId) : NaN;
    if (itemMode === "new" && !invName.trim()) return alert("Give the new item a name");
    if (storeMode === "new" && !invStoreName.trim()) return alert("Give the new store a name");
    if (itemMode === "existing" && !isFinite(itemId)) return alert("Pick an item (or switch to “New item”)");
    if (storeMode === "existing" && !isFinite(storeId)) return alert("Pick a store (or switch to “New store”)");
    setInvBusy(true);
    setInvMsg("");
    try {
      if (itemMode === "new") {
        const r = await fetch("/api/items", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name_en: invName.trim(), category: invCategory, base_unit: invBaseUnit }),
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || "Could not create item");
        // re-search to get the new item's id, then match by name
        await search();
        const r2 = await fetch(`/api/items?q=${encodeURIComponent(invName.trim())}`);
        const j2 = await r2.json();
        const found = (j2.results?.[0]?.item as { id: number } | undefined);
        if (!found) throw new Error("Item created — please re-open the form and pick it from the list.");
        itemId = found.id;
      }
      let isOnline = invOnline;
      if (storeMode === "new") {
        const r = await fetch("/api/stores", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: invStoreName.trim(),
            city: invOnline ? "Online" : invStoreCity.trim() || city,
            address: "",
            lat: invOnline ? 0 : isFinite(lat) ? lat : 0,
            lng: invOnline ? 0 : isFinite(lng) ? lng : 0,
            is_online: invOnline,
          }),
        });
        const j = await r.json();
        if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
        if (!j.ok) throw new Error(j.error || "Could not create store");
        await loadStores();
        const r2 = await fetch("/api/stores");
        const j2 = await r2.json();
        const match = (j2.stores as StoreRow[]).find((s) => s.name === invStoreName.trim());
        if (!match) throw new Error("Store created — please re-open the form and pick it from the list.");
        storeId = match.id;
      } else {
        const picked = stores.find((s) => s.id === storeId);
        if (picked) isOnline = picked.is_online === 1;
      }
      const r = await fetch("/api/prices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: itemId,
          store_id: storeId,
          price,
          unit: invUnit,
          quality: Math.min(5, Math.max(1, parseInt(invQuality, 10) || 3)),
          stock_level: invStock,
          is_online: isOnline ? 1 : 0,
          comment: invNote.trim() || "added from /stores inventory form",
        }),
      });
      const j = await r.json();
      if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
      if (!j.ok) throw new Error(j.error || "Could not save price");
      setInvMsg(j.queued ? "Queued for review (fresh scrape wins) ✓" : "Inventory added ✓");
      setInvPrice("");
      setInvNote("");
      search();
    } catch (e) {
      setInvMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setInvBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-extrabold">Compare prices near you</h1>
        <button onClick={() => setShowAdd((v) => !v)} className="ml-auto rounded-full bg-zinc-900 px-4 py-2 text-sm font-bold text-white">
          {showAdd ? "− Hide add-inventory" : "＋ Add inventory"}
        </button>
      </div>

      {showAdd && (
        <div className="grid gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h2 className="font-bold">➕ Add inventory / report a price</h2>
          <p className="text-xs text-gray-500">
            Add a price you saw in-store or online. Pick an existing item + store, or create them inline.
            Units default to SI (kg/g) — switch to lb/oz only if the shelf tag uses them.
            {session?.user ? "" : " Sign-in required."}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 rounded-xl border bg-white p-3 text-sm">
              <div className="flex gap-2 text-xs">
                <button onClick={() => setItemMode("existing")} className={`rounded px-2 py-1 ${itemMode === "existing" ? "bg-zinc-900 text-white" : "border"}`}>Existing item</button>
                <button onClick={() => setItemMode("new")} className={`rounded px-2 py-1 ${itemMode === "new" ? "bg-zinc-900 text-white" : "border"}`}>＋ New item</button>
              </div>
              {itemMode === "existing" ? (
                <label className="text-xs">Item
                  <select value={invItemId} onChange={(e) => setInvItemId(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
                    <option value="">— pick an item —</option>
                    {itemOptions.map((it) => (
                      <option key={it.id} value={it.id}>{it.name_en} ({it.base_unit})</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="text-xs">New item name (English)
                    <input value={invName} onChange={(e) => setInvName(e.target.value)} placeholder="e.g. Basmati Rice 5kg bag" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
                  </label>
                  <div className="flex gap-2">
                    <label className="w-1/2 text-xs">Category
                      <select value={invCategory} onChange={(e) => setInvCategory(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
                        {ITEM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </label>
                    <label className="w-1/2 text-xs">Base unit (SI default)
                      <UnitSelect value={invBaseUnit} onChange={setInvBaseUnit} className="mt-1 w-full rounded border px-2 py-2 text-sm" />
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="grid gap-2 rounded-xl border bg-white p-3 text-sm">
              <div className="flex gap-2 text-xs">
                <button onClick={() => setStoreMode("existing")} className={`rounded px-2 py-1 ${storeMode === "existing" ? "bg-zinc-900 text-white" : "border"}`}>Existing store</button>
                <button onClick={() => setStoreMode("new")} className={`rounded px-2 py-1 ${storeMode === "new" ? "bg-zinc-900 text-white" : "border"}`}>＋ New store</button>
              </div>
              {storeMode === "existing" ? (
                <label className="text-xs">Store
                  <select value={invStoreId} onChange={(e) => setInvStoreId(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
                    <option value="">— pick a store —</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.is_online ? "online" : s.city}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <label className="text-xs">New store name
                    <input value={invStoreName} onChange={(e) => setInvStoreName(e.target.value)} placeholder="e.g. Fry's Baseline" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="w-1/2 text-xs">City
                      <input value={invStoreCity} onChange={(e) => setInvStoreCity(e.target.value)} disabled={invOnline} className="mt-1 w-full rounded border px-2 py-2 text-sm disabled:opacity-50" />
                    </label>
                    <label className="flex w-1/2 items-center gap-2 pb-2 text-xs">
                      <input type="checkbox" checked={invOnline} onChange={(e) => setInvOnline(e.target.checked)} /> Online store
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="grid gap-2 rounded-xl border bg-white p-3 text-sm md:grid-cols-5">
            <label className="text-xs">Price ($)
              <input value={invPrice} onChange={(e) => setInvPrice(e.target.value)} inputMode="decimal" placeholder="e.g. 4.99" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
            </label>
            <label className="text-xs">Quoted unit (SI default)
              <UnitSelect value={invUnit} onChange={setInvUnit} className="mt-1 w-full rounded border px-2 py-2 text-sm" />
            </label>
            <label className="text-xs">Quality
              <select value={invQuality} onChange={(e) => setInvQuality(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
              </select>
            </label>
            <label className="text-xs">Stock
              <select value={invStock} onChange={(e) => setInvStock(e.target.value)} className="mt-1 w-full rounded border px-2 py-2 text-sm">
                {STOCK_OPTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-xs">Note (pack size, shelf tag…)
              <input value={invNote} onChange={(e) => setInvNote(e.target.value)} placeholder="e.g. 2lb bag" className="mt-1 w-full rounded border px-2 py-2 text-sm" />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <button onClick={submitInventory} disabled={invBusy} className="rounded bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">
              {invBusy ? "Saving…" : "Save inventory"}
            </button>
            {invPreview && (
              <span className="text-xs text-gray-600">
                Preview: <b>${parseFloat(invPrice).toFixed(2)}/{invUnit}</b>
                {" → "}
                {isFinite(invPreview.inDisplay) ? <b>${invPreview.inDisplay.toFixed(2)}/{unit}</b> : "per piece"}
                {isFinite(invPreview.perKg) ? <span className="text-gray-400"> (${invPreview.perKg.toFixed(2)}/kg)</span> : null}
              </span>
            )}
            {invMsg && <span className="text-xs font-semibold text-emerald-700">{invMsg}</span>}
          </div>
        </div>
      )}

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
        <div className="text-sm">
          <label htmlFor="display-unit">Display unit + converter <span className="rounded bg-emerald-100 px-1 text-[11px] font-semibold text-emerald-800">SI default</span></label>
          <UnitSelect id="display-unit" value={unit} onChange={setUnit} />
          <div className="mt-1 flex gap-1 text-xs">
            <button onClick={() => setUnit("kg")} title="Metric default" className={`rounded px-2 py-0.5 ${unitSystem(unit) === "si" && unit === "kg" ? "bg-emerald-600 text-white" : "border"}`}>kg</button>
            <button onClick={() => setUnit("g")} title="Metric small packs" className={`rounded px-2 py-0.5 ${unit === "g" ? "bg-emerald-600 text-white" : "border"}`}>g</button>
            <span className="self-center text-gray-300">|</span>
            <button onClick={() => setUnit("lb")} title="US customary" className={`rounded px-2 py-0.5 ${unit === "lb" ? "bg-zinc-700 text-white" : "border"}`}>lb</button>
            <button onClick={() => setUnit("oz")} title="US customary" className={`rounded px-2 py-0.5 ${unit === "oz" ? "bg-zinc-700 text-white" : "border"}`}>oz</button>
            <button onClick={() => setUnit("piece")} title="Count items" className={`rounded px-2 py-0.5 ${unit === "piece" ? "bg-zinc-700 text-white" : "border"}`}>pc</button>
          </div>
        </div>
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
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <button onClick={useMyLocation} className="rounded border px-3 py-2">📍 Use my location</button>
          <button onClick={saveDefault} title="Remember this city + coordinates as your default" className="rounded border px-3 py-2">💾 Set as default</button>
          <button onClick={() => { clearLoc(); setLat(33.4255); setLng(-111.94); setCity("Tempe"); }} className="rounded border px-3 py-2">↺ Tempe</button>
          <button onClick={search} className="rounded bg-emerald-600 px-4 py-2 font-bold text-white">{loading ? "…" : "Search"}</button>
        </div>
        <p className="text-xs text-gray-500 md:col-span-3">
          Lat {isFinite(lat) ? lat.toFixed(3) : "—"}, Lng {isFinite(lng) ? lng.toFixed(3) : "—"} · default: Tempe, AZ (change + “Set as default” to remember yours)
          {locMsg && <span className="text-emerald-600"> · {locMsg}</span>} · scraped 🤖 ranks first.
        </p>
      </div>

      <UnitConverter />

      <StoreMap userLat={lat} userLng={lng} radiusKm={radiusKm} stores={mapStores} />

      <p className="-mb-1 text-xs text-gray-500">✏️ Click any <b>price</b>, <b>★ quality</b> or <b>stock badge</b> to correct it inline{session?.user ? "" : " (sign-in required)"}.</p>
      <div className="grid gap-4">
        {data.map(({ item, options }) => (
          <div key={item.id} className="rounded-2xl border bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-bold">{item.name_en}</h2>
              {item.name_bn && <span className="text-sm text-gray-600">{item.name_bn}</span>}
              <span className="text-xs text-gray-400">{item.category} · {item.name_alt}</span>
            </div>
            {options.length === 0 && <p className="mt-2 text-sm text-gray-500">No stores in range.</p>}
            <div className="mt-2 overflow-x-auto slim-scroll">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="text-left text-xs text-gray-500">
                  <th className="py-1">Item</th><th>Store</th><th>Dist</th><th>Quoted</th><th>Per {unit}</th><th>Quality</th><th>Stock</th><th>Src</th>
                </tr></thead>
                <tbody>
                  {(options as Record<string, unknown>[]).map((o) => {
                    const quoted = Number(o.price);
                    const conv = o.unit === unit ? quoted : convertPrice(quoted, String(o.unit), unit);
                    const dist = Number(o.distanceKm);
                    const oid = String(o.id);
                    const isEd = editing?.id === oid;
                    return (
                      <tr key={oid} className="border-t">
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
                        <td>
                          {isEd && editing.field === "price" ? (
                            <span className="flex gap-1">
                              <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEdit(o, item.id); if (e.key === "Escape") setEditing(null); }} className="w-20 rounded border px-1 py-0.5" />
                              <button onClick={() => saveEdit(o, item.id)} className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">✓</button>
                            </span>
                          ) : (
                            <button title="Click to correct price" onClick={() => startEdit(oid, "price", String(quoted))} className="rounded px-1 hover:bg-emerald-50 hover:underline">
                              ${quoted.toFixed(2)}/{String(o.unit)}
                            </button>
                          )}
                        </td>
                        <td className="font-bold text-emerald-700">{isFinite(conv) ? `$${conv.toFixed(2)}` : `$${quoted.toFixed(2)}/pc`}</td>
                        <td>
                          {isEd && editing.field === "quality" ? (
                            <span className="flex gap-1">
                              <select autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="rounded border px-1 py-0.5">
                                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} ★</option>)}
                              </select>
                              <button onClick={() => saveEdit(o, item.id)} className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">✓</button>
                            </span>
                          ) : (
                            <button title="Click to correct quality" onClick={() => startEdit(oid, "quality", String(Number(o.quality) || 3))} className="rounded px-1 hover:bg-emerald-50 hover:underline">
                              {"★".repeat(Number(o.quality) || 3)}
                            </button>
                          )}
                        </td>
                        <td>
                          {isEd && editing.field === "stock" ? (
                            <span className="flex gap-1">
                              <select autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="rounded border px-1 py-0.5 text-xs">
                                {STOCK_OPTS.map((s) => <option key={s}>{s}</option>)}
                              </select>
                              <button onClick={() => saveEdit(o, item.id)} className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white">✓</button>
                            </span>
                          ) : (
                            <button title="Click to correct stock" onClick={() => startEdit(oid, "stock", String(o.stock_level))} className={`rounded px-1.5 py-0.5 text-xs hover:ring-2 hover:ring-emerald-300 ${String(o.stock_level).includes("out") || String(o.stock_level).includes("bad") ? "bg-red-100 text-red-700" : String(o.stock_level).includes("low") ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>{String(o.stock_level)}</button>
                          )}
                        </td>
                        <td>{String(o.source) === "scraped" ? "🤖" : "👤"}</td>
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

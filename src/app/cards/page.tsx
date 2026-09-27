"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOwned, toggleOwned, getOwnedOnly, setOwnedOnly } from "@/lib/owned-cards";

type Scored = {
  card: { id: number; name: string; bank: string; image_url: string; annual_fee: number; rating: number; customer_care: string; fraud_number: string; bank_website: string };
  benefits: Record<string, unknown>[];
  matched: Record<string, unknown>[];
  bestRate: number;
  score: number;
};

const CATS = ["", "grocery", "dining", "travel", "fuel", "online", "pharmacy"];

export default function CardsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [category, setCategory] = useState("grocery");
  const [place, setPlace] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Scored[]>([]);
  const [owned, setOwned] = useState<number[]>(() => getOwned());
  const [ownedOnly, setOwnedOnlyState] = useState(() => getOwnedOnly());
  const [form, setForm] = useState({ name: "", bank: "", annual_fee: "0", rating: "4", image_url: "", apply_url: "", customer_care: "", fraud_number: "", bank_website: "", category: "grocery", merchant_place: "any", reward_rate: "5", reward_type: "cashback", description: "" });
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function search() {
    const sp = new URLSearchParams({ category, place, q });
    const r = await fetch(`/api/cards?${sp}`);
    const j = await r.json();
    if (j.ok) setResults(j.results);
  }

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

  function flipOwned(id: number) {
    setOwned(toggleOwned(id));
  }

  function flipFilter(v: boolean) {
    setOwnedOnly(v);
    setOwnedOnlyState(v);
  }

  async function addCard() {
    if (!session?.user) {
      if (confirm("Sign in to add cards. Go to sign-in?")) router.push("/signin");
      return;
    }
    if (!form.name.trim()) return alert("Card name required");
    const r = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, bank: form.bank, annual_fee: Number(form.annual_fee),
        rating: Math.min(5, Math.max(0, Number(form.rating) || 0)),
        image_url: form.image_url, apply_url: form.apply_url,
        customer_care: form.customer_care, fraud_number: form.fraud_number, bank_website: form.bank_website,
        benefits: [{ category: form.category, merchant_place: form.merchant_place, reward_rate: Number(form.reward_rate), reward_type: form.reward_type, description: form.description }],
      }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
    if (j.ok) {
      setOwned(toggleOwned(Number(j.id))); // a card you add is one you have
      setForm({ ...form, name: "", description: "", image_url: "" });
      router.push(`/cards/${j.id}`);
    }
  }

  async function uploadFormImage(file: File) {
    if (!session?.user) {
      if (confirm("Sign in to add cards. Go to sign-in?")) router.push("/signin");
      return;
    }
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const uj = await up.json();
      if (uj.ok) setForm({ ...form, image_url: String(uj.url) });
      else alert(`Upload failed: ${uj.error}`);
    } finally {
      setUploadBusy(false);
    }
  }

  const visible = ownedOnly ? results.filter((r) => owned.includes(r.card.id)) : results;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold">Which card pays most here?</h1>
        <label className="flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-sm font-semibold">
          <input type="checkbox" checked={ownedOnly} onChange={(e) => flipFilter(e.target.checked)} className="accent-emerald-600" />
          🎯 Only my cards
        </label>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <label className="text-sm">Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
            {CATS.map((c) => <option key={c} value={c}>{c || "All"}</option>)}
          </select>
        </label>
        <label className="text-sm">Place / merchant
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. airlines, online, any" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="text-sm">Search all
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="bank, card, benefit…" className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <div className="flex items-end"><button onClick={search} className="w-full rounded bg-emerald-600 px-4 py-2 font-bold text-white">Find best</button></div>
      </div>

      {ownedOnly && owned.length === 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
          🎯 “Only my cards” is on but you haven’t marked any yet — tap <b>+ Mine</b> on cards you own, or switch the filter off to browse everything.
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((r, i) => {
          const mine = owned.includes(r.card.id);
          return (
            <div key={r.card.id} className={`rounded-2xl border p-4 ${i === 0 ? "border-emerald-400 bg-emerald-50" : "bg-white"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  {r.card.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.card.image_url} alt={r.card.name} loading="lazy" className="h-12 w-20 shrink-0 rounded-lg border object-cover" />
                  ) : null}
                  <h2 className="font-bold">
                    <Link href={`/cards/${r.card.id}`} className="hover:text-emerald-700 hover:underline">
                      {i === 0 ? "🏆 " : ""}{r.card.name}
                    </Link>{" "}
                    <span className="text-sm font-normal text-gray-500">· {r.card.bank}</span>
                  </h2>
                </div>
                <button
                  onClick={() => flipOwned(r.card.id)}
                  title={mine ? "Remove from my cards" : "I have this card"}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${mine ? "bg-emerald-600 text-white" : "border hover:bg-emerald-50"}`}
                >
                  {mine ? "✓ Mine" : "+ Mine"}
                </button>
              </div>
              <p className="text-xs text-gray-500">★ {r.card.rating} · fee ${r.card.annual_fee} · best match {r.bestRate}%/x</p>
              <ul className="mt-2 space-y-1 text-sm">
                {r.matched.map((b) => (
                  <li key={String(b.id)} className="rounded bg-white/70 border px-2 py-1">💰 <b>{String(b.reward_rate)}{String(b.reward_type) === "cashback" ? "%" : "x"} {String(b.reward_type)}</b> on {String(b.category)} @ {String(b.merchant_place)} — {String(b.description)} {String(b.cap) && <span className="text-gray-500">({String(b.cap)})</span>}</li>
                ))}
                {r.matched.length === 0 && <li className="text-gray-500">No benefit matches this search — all benefits:</li>}
                {r.matched.length === 0 && (r.benefits as Record<string, unknown>[]).map((b) => (
                  <li key={String(b.id)} className="text-xs text-gray-600">• {String(b.category)}: {String(b.description)}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Add a new card {session?.user ? "" : "(sign-in required)"}</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Card name" className="rounded border px-3 py-2" />
          <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Bank" className="rounded border px-3 py-2" />
          <input value={form.annual_fee} onChange={(e) => setForm({ ...form, annual_fee: e.target.value })} placeholder="Annual fee" className="rounded border px-3 py-2" />
          <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder="Rating 0–5" className="rounded border px-3 py-2" />
          <input value={form.customer_care} onChange={(e) => setForm({ ...form, customer_care: e.target.value })} placeholder="📞 Customer care number" className="rounded border px-3 py-2" />
          <input value={form.fraud_number} onChange={(e) => setForm({ ...form, fraud_number: e.target.value })} placeholder="🚨 Lost / fraud number" className="rounded border px-3 py-2" />
          <input value={form.bank_website} onChange={(e) => setForm({ ...form, bank_website: e.target.value })} placeholder="🌐 Bank website" className="rounded border px-3 py-2" />
          <input value={form.apply_url} onChange={(e) => setForm({ ...form, apply_url: e.target.value })} placeholder="Apply link (https://…)" className="rounded border px-3 py-2" />
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFormImage(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploadBusy} className="w-full rounded border px-3 py-2 font-semibold hover:bg-zinc-50 disabled:opacity-50">
              {uploadBusy ? "Uploading…" : form.image_url ? "📷 Image attached ✓ (tap to change)" : "📷 Upload card image"}
            </button>
          </div>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="category" className="rounded border px-3 py-2" />
          <input value={form.merchant_place} onChange={(e) => setForm({ ...form, merchant_place: e.target.value })} placeholder="place (any/supermarkets/online…)" className="rounded border px-3 py-2" />
          <input value={form.reward_rate} onChange={(e) => setForm({ ...form, reward_rate: e.target.value })} placeholder="reward %" className="rounded border px-3 py-2" />
          <select value={form.reward_type} onChange={(e) => setForm({ ...form, reward_type: e.target.value })} className="rounded border px-3 py-2">
            {["cashback", "points", "miles"].map((t) => <option key={t}>{t}</option>)}
          </select>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="description" className="md:col-span-2 rounded border px-3 py-2" />
          <button onClick={addCard} className="rounded bg-zinc-900 px-4 py-2 font-bold text-white">Save card → open its page</button>
        </div>
      </div>
    </motion.div>
  );
}

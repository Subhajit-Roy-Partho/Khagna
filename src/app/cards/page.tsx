"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Scored = {
  card: { id: number; name: string; bank: string; image_url: string; annual_fee: number; rating: number };
  benefits: Record<string, unknown>[];
  matched: Record<string, unknown>[];
  bestRate: number;
  score: number;
};

const CATS = ["", "grocery", "dining", "travel", "fuel", "online", "pharmacy"];

export default function CardsPage() {
  const [category, setCategory] = useState("grocery");
  const [place, setPlace] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Scored[]>([]);
  const [form, setForm] = useState({ name: "", bank: "", annual_fee: "0", category: "grocery", merchant_place: "any", reward_rate: "5", description: "" });

  async function search() {
    const sp = new URLSearchParams({ category, place, q });
    const r = await fetch(`/api/cards?${sp}`);
    const j = await r.json();
    if (j.ok) setResults(j.results);
  }

  useEffect(() => {
    fetch("/api/init", { method: "POST" }).then(search).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addCard() {
    if (!form.name.trim()) return alert("Card name required");
    const r = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, bank: form.bank, annual_fee: Number(form.annual_fee),
        benefits: [{ category: form.category, merchant_place: form.merchant_place, reward_rate: Number(form.reward_rate), description: form.description }],
      }),
    });
    const j = await r.json();
    if (j.ok) { alert("Card added"); setForm({ ...form, name: "", description: "" }); search(); }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <h1 className="text-xl font-extrabold">Which card pays most here?</h1>
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

      <div className="grid gap-3 md:grid-cols-2">
        {results.map((r, i) => (
          <div key={r.card.id} className={`rounded-2xl border p-4 ${i === 0 ? "border-emerald-400 bg-emerald-50" : "bg-white"}`}>
            <h2 className="font-bold">{i === 0 ? "🏆 " : ""}{r.card.name} <span className="text-sm font-normal text-gray-500">· {r.card.bank}</span></h2>
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
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="font-bold">Add / update a card benefit</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-3 text-sm">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Card name" className="rounded border px-3 py-2" />
          <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Bank" className="rounded border px-3 py-2" />
          <input value={form.annual_fee} onChange={(e) => setForm({ ...form, annual_fee: e.target.value })} placeholder="Annual fee" className="rounded border px-3 py-2" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="category" className="rounded border px-3 py-2" />
          <input value={form.merchant_place} onChange={(e) => setForm({ ...form, merchant_place: e.target.value })} placeholder="place (any/online/airlines…)" className="rounded border px-3 py-2" />
          <input value={form.reward_rate} onChange={(e) => setForm({ ...form, reward_rate: e.target.value })} placeholder="reward %" className="rounded border px-3 py-2" />
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="description" className="md:col-span-2 rounded border px-3 py-2" />
          <button onClick={addCard} className="rounded bg-zinc-900 px-4 py-2 font-bold text-white">Save card</button>
        </div>
      </div>
    </motion.div>
  );
}

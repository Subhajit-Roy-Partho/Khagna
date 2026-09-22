"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwned, toggleOwned } from "@/lib/owned-cards";

export default function CardDetailClient({
  card,
  benefits,
}: {
  card: Record<string, unknown>;
  benefits: Record<string, unknown>[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [mine, setMine] = useState(() => getOwned().includes(Number(card.id)));
  const [ben, setBen] = useState({ category: "grocery", merchant_place: "any", reward_rate: "5", reward_type: "cashback", cap: "", description: "" });
  const [msg, setMsg] = useState("");

  async function addBenefit() {
    if (!session?.user) {
      if (confirm("Sign in to add benefits. Go to sign-in?")) router.push("/signin");
      return;
    }
    if (!ben.description.trim() && !ben.category.trim()) return alert("Describe the benefit first");
    const r = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_id: Number(card.id), benefit: { ...ben, reward_rate: Number(ben.reward_rate) || 0 } }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
    if (j.ok) {
      setMsg("Benefit added ✓");
      setBen({ ...ben, description: "" });
      setTimeout(() => window.location.reload(), 800);
    } else {
      setMsg(`Error: ${j.error}`);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Link href="/cards" className="text-sm font-semibold text-emerald-700">← All cards</Link>
      <div className="rounded-3xl border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">{String(card.name)}</h1>
            <p className="text-sm text-gray-500">{String(card.bank)} · ★ {String(card.rating)} · annual fee ${String(card.annual_fee)}</p>
          </div>
          <button
            onClick={() => setMine(toggleOwned(Number(card.id)).includes(Number(card.id)))}
            className={`rounded-full px-4 py-2 text-sm font-bold ${mine ? "bg-emerald-600 text-white" : "border hover:bg-emerald-50"}`}
          >
            {mine ? "✓ In my wallet" : "+ I have this card"}
          </button>
        </div>
        {String(card.apply_url || "") && (
          <a href={String(card.apply_url)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-emerald-700">Apply →</a>
        )}
      </div>

      <div className="rounded-3xl border bg-white p-6">
        <h2 className="font-bold">All benefits ({benefits.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {benefits.map((b) => (
            <li key={String(b.id)} className="rounded-xl border px-3 py-2">
              💰 <b>{String(b.reward_rate)}{String(b.reward_type) === "cashback" ? "%" : "x"} {String(b.reward_type)}</b> on {String(b.category)} @ {String(b.merchant_place)} — {String(b.description)}
              {String(b.cap || "") && <span className="text-gray-500"> ({String(b.cap)})</span>}
            </li>
          ))}
          {benefits.length === 0 && <li className="text-gray-500">No benefits listed yet — add the first one below.</li>}
        </ul>
      </div>

      <div className="rounded-3xl border bg-white p-6">
        <h2 className="font-bold">Add a benefit {session?.user ? "" : "(sign-in required)"}</h2>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <input value={ben.category} onChange={(e) => setBen({ ...ben, category: e.target.value })} placeholder="category" className="rounded border px-3 py-2" />
          <input value={ben.merchant_place} onChange={(e) => setBen({ ...ben, merchant_place: e.target.value })} placeholder="place (any/online/airlines…)" className="rounded border px-3 py-2" />
          <input value={ben.reward_rate} onChange={(e) => setBen({ ...ben, reward_rate: e.target.value })} placeholder="rate" className="rounded border px-3 py-2" />
          <input value={ben.reward_type} onChange={(e) => setBen({ ...ben, reward_type: e.target.value })} placeholder="cashback/miles/points" className="rounded border px-3 py-2" />
          <input value={ben.cap} onChange={(e) => setBen({ ...ben, cap: e.target.value })} placeholder="cap (optional)" className="rounded border px-3 py-2" />
          <input value={ben.description} onChange={(e) => setBen({ ...ben, description: e.target.value })} placeholder="description" className="rounded border px-3 py-2" />
        </div>
        <button onClick={addBenefit} className="mt-2 rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white">Add benefit</button>
        {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      </div>
    </motion.div>
  );
}

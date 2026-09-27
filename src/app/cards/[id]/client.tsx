"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getOwned, toggleOwned } from "@/lib/owned-cards";

const BEN_CATS = ["grocery", "dining", "travel", "fuel", "online", "pharmacy", "other"];
const BEN_PLACES = ["any", "supermarkets", "grocery", "wholesale", "online", "target", "whole foods", "kroger", "airlines", "anywhere"];
const BEN_TYPES = ["cashback", "points", "miles"];

function needAuth(router: ReturnType<typeof useRouter>): boolean {
  if (confirm("Sign in to manage this card. Go to sign-in?")) router.push("/signin");
  return true;
}

export default function CardDetailClient({
  card,
  benefits,
}: {
  card: Record<string, unknown>;
  benefits: Record<string, unknown>[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const authed = !!session?.user;
  const [mine, setMine] = useState(() => getOwned().includes(Number(card.id)));
  const [ben, setBen] = useState({ category: "grocery", merchant_place: "supermarkets", reward_rate: "5", reward_type: "cashback", cap: "", description: "" });
  const [msg, setMsg] = useState("");
  // edit-details form, prefilled from the card row
  const [edit, setEdit] = useState({
    name: String(card.name || ""),
    bank: String(card.bank || ""),
    annual_fee: String(card.annual_fee ?? 0),
    rating: String(card.rating ?? 0),
    apply_url: String(card.apply_url || ""),
    customer_care: String(card.customer_care || ""),
    fraud_number: String(card.fraud_number || ""),
    bank_website: String(card.bank_website || ""),
  });
  const [editMsg, setEditMsg] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function patchCard(payload: Record<string, unknown>): Promise<boolean> {
    if (!authed) {
      needAuth(router);
      return false;
    }
    const r = await fetch("/api/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: Number(card.id), ...payload }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) {
      router.push("/signin");
      return false;
    }
    return !!j.ok;
  }

  async function addBenefit() {
    if (!authed) {
      needAuth(router);
      return;
    }
    if (!ben.description.trim()) return alert("Describe the benefit first (e.g. 6% at U.S. supermarkets)");
    const rate = Number(ben.reward_rate);
    if (!isFinite(rate) || rate <= 0) return alert("Enter a valid reward rate");
    const r = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_id: Number(card.id), benefit: { ...ben, reward_rate: rate } }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) {
      router.push("/signin");
      return;
    }
    if (j.ok) {
      setMsg("Benefit added ✓");
      setBen({ ...ben, description: "", cap: "" });
      setTimeout(() => window.location.reload(), 800);
    } else {
      setMsg(`Error: ${j.error}`);
    }
  }

  async function saveDetails() {
    setEditMsg("");
    const ok = await patchCard({
      ...edit,
      annual_fee: Number(edit.annual_fee) || 0,
      rating: Math.min(5, Math.max(0, Number(edit.rating) || 0)),
    });
    setEditMsg(ok ? "Saved ✓" : "Could not save.");
    if (ok) setTimeout(() => window.location.reload(), 800);
  }

  async function uploadImage(file: File) {
    if (!authed) {
      needAuth(router);
      return;
    }
    setImgBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const uj = await up.json();
      if (!uj.ok) {
        alert(`Upload failed: ${uj.error}`);
        return;
      }
      const ok = await patchCard({ image_url: String(uj.url) });
      if (ok) window.location.reload();
    } finally {
      setImgBusy(false);
    }
  }

  const care = String(card.customer_care || "");
  const fraud = String(card.fraud_number || "");
  const site = String(card.bank_website || "");

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4">
      <Link href="/cards" className="text-sm font-semibold text-emerald-700">← All cards</Link>

      <div className="rounded-3xl border bg-white p-6">
        <div className="flex flex-wrap items-start gap-4">
          {String(card.image_url || "") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={String(card.image_url)} alt={String(card.name)} className="h-28 w-44 rounded-xl border object-cover" />
          ) : (
            <span className="grid h-28 w-44 place-items-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 text-3xl font-black text-white">
              {String(card.bank || "?")[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black">{String(card.name)}</h1>
            <p className="text-sm text-gray-500">{String(card.bank)} · ★ {String(card.rating)} · annual fee ${String(card.annual_fee)}</p>
            {String(card.apply_url || "") && (
              <a href={String(card.apply_url)} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-emerald-700">Apply →</a>
            )}
            <div className="mt-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              <button onClick={() => (authed ? fileRef.current?.click() : needAuth(router))} disabled={imgBusy} className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50">
                {imgBusy ? "Uploading…" : String(card.image_url || "") ? "📷 Replace card image" : "📷 Add card image"}
              </button>
            </div>
          </div>
          <button
            onClick={() => setMine(toggleOwned(Number(card.id)).includes(Number(card.id)))}
            className={`rounded-full px-4 py-2 text-sm font-bold ${mine ? "bg-emerald-600 text-white" : "border hover:bg-emerald-50"}`}
          >
            {mine ? "✓ In my wallet" : "+ I have this card"}
          </button>
        </div>

        {(care || fraud || site) && (
          <div className="mt-4 grid gap-2 rounded-2xl bg-zinc-50 p-3 text-sm md:grid-cols-3">
            {care && <p>📞 <b>Care:</b> <a href={`tel:${care.replace(/[^+\d]/g, "")}`} className="font-semibold text-emerald-700 hover:underline">{care}</a></p>}
            {fraud && <p>🚨 <b>Lost / fraud:</b> <a href={`tel:${fraud.replace(/[^+\d]/g, "")}`} className="font-semibold text-red-600 hover:underline">{fraud}</a></p>}
            {site && <p>🌐 <b>Bank:</b> <a href={site.startsWith("http") ? site : `https://${site}`} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 hover:underline">{site.replace(/^https?:\/\//, "")}</a></p>}
          </div>
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
        <h2 className="font-bold">➕ Add a benefit / reward {authed ? "" : "(sign-in required)"}</h2>
        <p className="text-xs text-gray-500">Spotted a grocery, dining, fuel or travel earn missing above? Add it — it feeds the best-card matcher instantly.</p>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <label className="text-xs">Category
            <select value={ben.category} onChange={(e) => setBen({ ...ben, category: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm">
              {BEN_CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-xs">Place
            <select value={ben.merchant_place} onChange={(e) => setBen({ ...ben, merchant_place: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm">
              {BEN_PLACES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-xs">Reward rate (% or x)
            <input value={ben.reward_rate} onChange={(e) => setBen({ ...ben, reward_rate: e.target.value })} inputMode="decimal" placeholder="e.g. 6" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">Reward type
            <select value={ben.reward_type} onChange={(e) => setBen({ ...ben, reward_type: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm">
              {BEN_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs">Cap (optional)
            <input value={ben.cap} onChange={(e) => setBen({ ...ben, cap: e.target.value })} placeholder="e.g. up to $6,000/yr" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">Description
            <input value={ben.description} onChange={(e) => setBen({ ...ben, description: e.target.value })} placeholder="e.g. 6% at U.S. supermarkets" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
        </div>
        <button onClick={addBenefit} className="mt-2 rounded bg-zinc-900 px-4 py-2 text-sm font-bold text-white">Add benefit</button>
        {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      </div>

      <div className="rounded-3xl border bg-white p-6">
        <h2 className="font-bold">✏️ Edit card details {authed ? "" : "(sign-in required)"}</h2>
        <p className="text-xs text-gray-500">Fix the fee, add customer-care / fraud numbers, bank website, or an apply link.</p>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-3">
          <label className="text-xs">Card name
            <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">Bank / issuer
            <input value={edit.bank} onChange={(e) => setEdit({ ...edit, bank: e.target.value })} className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">Annual fee ($)
            <input value={edit.annual_fee} onChange={(e) => setEdit({ ...edit, annual_fee: e.target.value })} inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">Rating (0–5)
            <input value={edit.rating} onChange={(e) => setEdit({ ...edit, rating: e.target.value })} inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">📞 Customer care
            <input value={edit.customer_care} onChange={(e) => setEdit({ ...edit, customer_care: e.target.value })} placeholder="e.g. 1-800-555-0100" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">🚨 Lost / fraud line
            <input value={edit.fraud_number} onChange={(e) => setEdit({ ...edit, fraud_number: e.target.value })} placeholder="e.g. 1-800-555-0199" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">🌐 Bank website
            <input value={edit.bank_website} onChange={(e) => setEdit({ ...edit, bank_website: e.target.value })} placeholder="e.g. https://example-bank.com" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="text-xs md:col-span-2">Apply link
            <input value={edit.apply_url} onChange={(e) => setEdit({ ...edit, apply_url: e.target.value })} placeholder="https://…" className="mt-1 w-full rounded border px-3 py-2 text-sm" />
          </label>
        </div>
        <button onClick={saveDetails} className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white">Save details</button>
        {editMsg && <p className="mt-2 text-sm text-emerald-700">{editMsg}</p>}
      </div>
    </motion.div>
  );
}

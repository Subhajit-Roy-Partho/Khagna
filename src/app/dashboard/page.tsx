"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const authed = !!session?.user;
  const [data, setData] = useState<{ corrections: Record<string, unknown>[]; comments: Record<string, unknown>[] }>({ corrections: [], comments: [] });
  const [comment, setComment] = useState({ store_id: "", item_id: "", text: "", tag: "info" });
  const [storeForm, setStoreForm] = useState({ name: "", city: "Tempe", address: "", lat: "", lng: "", is_online: false });
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch("/api/comments");
    const j = await r.json();
    if (j.ok) setData(j);
    await fetch("/api/init", { method: "POST" }).catch(() => {});
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetch("/api/comments");
      const j = await r.json();
      if (!cancelled && j.ok) setData(j);
      await fetch("/api/init", { method: "POST" }).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function needAuth(): boolean {
    if (!authed) {
      if (confirm("Sign in to make changes. Go to sign-in?")) router.push("/signin");
      return true;
    }
    return false;
  }

  async function postComment() {
    if (needAuth()) return;
    if (!comment.text.trim()) return alert("Write a comment first");
    const r = await fetch("/api/comments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store_id: comment.store_id ? Number(comment.store_id) : null, item_id: comment.item_id ? Number(comment.item_id) : null, text: comment.text, tag: comment.tag }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
    if (j.ok) { setComment({ ...comment, text: "" }); load(); }
  }

  async function addStore() {
    if (needAuth()) return;
    if (!storeForm.name.trim()) return alert("Store name required");
    const r = await fetch("/api/stores", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...storeForm, lat: Number(storeForm.lat) || 0, lng: Number(storeForm.lng) || 0 }),
    });
    const j = await r.json();
    if (j.ok === false && r.status === 401) { router.push("/signin"); return; }
    setMsg(j.ok ? "Store added ✓" : `Error: ${j.error}`);
  }

  async function runScrape() {
    setMsg("Scraping…");
    const r = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runAll: true }) });
    const j = await r.json();
    setMsg(j.ok ? `Scraper updated ${j.updated} prices (scraped wins over manual) ✓` : `Error: ${j.error}`);
  }

  async function runCrawl() {
    setMsg("Crawling Tempe groceries (Fry's direct + Google Shopping backfill)…");
    const r = await fetch("/api/crawl", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retailers: ["frys", "target", "walmart", "samsclub", "costco"], limit: 3 }),
    });
    const j = await r.json();
    if (j.ok) {
      const by: Record<string, number> = {};
      for (const a of j.attempts as { status: string }[]) by[a.status] = (by[a.status] ?? 0) + 1;
      setMsg(`Crawl done: +${j.pricesUpserted} prices (${Object.entries(by).map(([k, v]) => `${v} ${k}`).join(", ")}) ✓`);
    } else {
      setMsg(`Error: ${j.error}`);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="grid gap-4">
      <h1 className="text-xl font-extrabold">User dashboard</h1>
      {!authed && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
          👀 Browsing is public, but changes need an account — <a href="/signin" className="font-bold text-emerald-700">sign in</a> to correct prices, comment, or add stores & cards. Your name/avatar will appear on everything you post.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Leave a comment / flag</h2>
          <p className="text-xs text-gray-500">Tags: low_stock, bad_product, good_deal, info…</p>
          <div className="mt-2 grid gap-2 text-sm">
            <div className="flex gap-2">
              <input value={comment.store_id} onChange={(e) => setComment({ ...comment, store_id: e.target.value })} placeholder="store id (optional)" className="w-1/2 rounded border px-2 py-2" />
              <input value={comment.item_id} onChange={(e) => setComment({ ...comment, item_id: e.target.value })} placeholder="item id (optional)" className="w-1/2 rounded border px-2 py-2" />
            </div>
            <select value={comment.tag} onChange={(e) => setComment({ ...comment, tag: e.target.value })} className="rounded border px-2 py-2">
              {["info", "low_stock", "out_of_stock", "bad_product", "good_deal", "price_wrong"].map((t) => <option key={t}>{t}</option>)}
            </select>
            <textarea value={comment.text} onChange={(e) => setComment({ ...comment, text: e.target.value })} placeholder="e.g. Eggs running low at Fry's Baseline…" className="rounded border px-2 py-2" rows={3} />
            <button onClick={postComment} className="rounded bg-emerald-600 px-4 py-2 font-bold text-white">Post{authed ? ` as ${(session?.user as { name?: string })?.name}` : ""}</button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Add a store</h2>
          <div className="mt-2 grid gap-2 text-sm">
            <input value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} placeholder="Store name" className="rounded border px-2 py-2" />
            <input value={storeForm.city} onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })} placeholder="City" className="rounded border px-2 py-2" />
            <input value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} placeholder="Address" className="rounded border px-2 py-2" />
            <div className="flex gap-2">
              <input value={storeForm.lat} onChange={(e) => setStoreForm({ ...storeForm, lat: e.target.value })} placeholder="lat" className="w-1/2 rounded border px-2 py-2" />
              <input value={storeForm.lng} onChange={(e) => setStoreForm({ ...storeForm, lng: e.target.value })} placeholder="lng" className="w-1/2 rounded border px-2 py-2" />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={storeForm.is_online} onChange={(e) => setStoreForm({ ...storeForm, is_online: e.target.checked })} /> Online store</label>
            <button onClick={addStore} className="rounded bg-zinc-900 px-4 py-2 font-bold text-white">Add store</button>
          </div>
          <hr className="my-3" />
          <h2 className="font-bold">Grocery crawl (server)</h2>
          <p className="text-xs text-gray-500">Frys direct plus Google Shopping backfill for Target, Walmart, Costco and Sams Club. Also runs weekly automatically.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={runCrawl} className="rounded bg-emerald-600 px-4 py-2 text-sm font-bold text-white">▶ Run grocery crawl now</button>
            <button onClick={runScrape} className="rounded border px-4 py-2 text-sm font-semibold">Legacy scraper</button>
          </div>
          {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Recent corrections ({data.corrections.length})</h2>
          <ul className="mt-2 space-y-1 text-sm max-h-80 overflow-auto">
            {data.corrections.map((c) => (
              <li key={String(c.id)} className="border-b py-1">#{String(c.id)} item {String(c.item_id)} @ store {String(c.store_id)}: {String(c.old_price)} → <b>{String(c.new_price)}</b> [{String(c.status)}] <span className="text-gray-500">{String(c.comment)}</span>{String(c.author_name || "") && <span className="text-emerald-700"> · by {String(c.author_name)}</span>}</li>
            ))}
            {data.corrections.length === 0 && <li className="text-gray-500">None yet.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-bold">Recent comments ({data.comments.length})</h2>
          <ul className="mt-2 space-y-1 text-sm max-h-80 overflow-auto">
            {data.comments.map((c) => (
              <li key={String(c.id)} className="border-b py-1">
                <span className="rounded bg-zinc-100 px-1 text-xs">{String(c.tag)}</span> {String(c.text)}
                {String(c.author_name || "") && (
                  <span className="ml-1 inline-flex items-center gap-1 text-xs text-gray-500">
                    {String(c.author_image || "") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={String(c.author_image)} alt="" className="h-4 w-4 rounded-full" />
                    ) : null}
                    {String(c.author_name)}
                  </span>
                )}
              </li>
            ))}
            {data.comments.length === 0 && <li className="text-gray-500">None yet.</li>}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

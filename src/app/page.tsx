"use client";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import Reveal from "@/components/Reveal";

const Hero3D = dynamic(() => import("@/components/Hero3D"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[280px] place-items-center text-emerald-200/70">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
    </div>
  ),
});

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const CITIES = ["Kolkata", "Dubai", "Chicago", "Delhi", "Mumbai", "Doha", "Sharjah", "New York", "Riyadh", "Houston"];

export default function Home() {
  return (
    <div className="grid gap-6">
      {/* ---------- HERO ---------- */}
      <section className="hero-mesh relative overflow-hidden rounded-3xl text-white shadow-2xl shadow-emerald-950/40">
        <div className="blob absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-400" />
        <div className="blob absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400" style={{ animationDelay: "-6s" }} />
        <div className="relative grid gap-6 p-6 md:grid-cols-2 md:p-10">
          <div className="flex flex-col justify-center">
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
                <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-400" />
                Live price intelligence · no AI needed
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="mt-4 text-3xl font-black leading-tight md:text-5xl"
            >
              Pay the <span className="gradient-text">least</span>,
              <br />every single time.
            </motion.h1>
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-3 max-w-xl text-sm text-emerald-50/85 md:text-base">
              Same product, many shops, no price tags? Khagna lists each item once —
              then compares availability, price (kg / lb / oz / piece), quality and
              distance across stores near you <em>and</em> online. Plus the credit
              card that pays you back the most.
            </motion.p>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-6 flex flex-wrap gap-3">
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} href="/stores" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-emerald-900 shadow-xl">
                Find cheapest grocery →
              </motion.a>
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} href="/basket" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur">
                Optimize my basket
              </motion.a>
              <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }} href="/cards" className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur">
                Best card for this shop
              </motion.a>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-6 flex gap-6 text-center">
              {[
                ["5+", "units compared"],
                ["2×", "store + online"],
                ["#1", "card match"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="text-2xl font-black">{n}</div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-100/70">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[280px] md:min-h-[380px]"
          >
            <Hero3D />
          </motion.div>
        </div>
        {/* city marquee */}
        <div className="relative border-t border-white/10 bg-black/20 py-2.5 backdrop-blur">
          <div className="flex overflow-hidden">
            <div className="marquee-track flex shrink-0 gap-8 pr-8 text-xs font-semibold uppercase tracking-widest text-emerald-100/80">
              {[...CITIES, ...CITIES].map((c, i) => (
                <span key={i} className="whitespace-nowrap">📍 {c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: "🛒", title: "Store smarts", desc: "Location + radius map, per-unit converter, distance, quality & stock flags, online vs offline.", href: "/stores", cta: "Compare stores" },
          { icon: "🧺", title: "Basket optimizer", desc: "List many items — Khagna finds the cheapest store mix with the least travel.", href: "/basket", cta: "Plan my trip" },
          { icon: "💳", title: "Card matcher", desc: "Every benefit catalogued. Search a category or place → best card instantly.", href: "/cards", cta: "Match my card" },
        ].map((f, i) => (
          <Reveal key={f.title} delay={i * 0.1}>
            <div className="card-lift h-full rounded-3xl border border-emerald-100 bg-white p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-2xl shadow-lg shadow-emerald-500/25">
                {f.icon}
              </div>
              <h2 className="mt-4 text-lg font-extrabold">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{f.desc}</p>
              <a href={f.href} className="mt-4 inline-block text-sm font-bold text-emerald-700 hover:gap-2">
                {f.cta} →
              </a>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ---------- HOW IT WORKS ---------- */}
      <Reveal>
        <section className="grid gap-4 rounded-3xl border border-emerald-100 bg-white p-6 md:grid-cols-3 md:p-8">
          {[
            ["01", "Search once", "Type in English, বাংলা, or a nickname — e.g. basmati, মসুর, ilish."],
            ["02", "Compare fairly", "Everything normalized to your unit. Scraped 🤖 prices rank above manual 👤 ones."],
            ["03", "Shop & save", "See distance, pick fewest stops, pay with the card that earns most back."],
          ].map(([n, t, d]) => (
            <div key={n} className="flex gap-3">
              <span className="gradient-text text-3xl font-black">{n}</span>
              <div>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-1 text-sm text-gray-600">{d}</p>
              </div>
            </div>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section className="rounded-3xl bg-zinc-900 p-6 text-sm leading-relaxed text-zinc-300 md:p-8">
          <b className="text-white">Always fresh:</b> the server scraper (<code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300">/api/scrape</code>,{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300">scripts/scraper.ts</code>) refreshes
          prices automatically and <b className="text-white">wins over manual edits</b>. Corrections made within
          7 days of a fresh scrape are queued for review in the dashboard.
        </section>
      </Reveal>
    </div>
  );
}

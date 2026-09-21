import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-35HJ7KPD22";

export const metadata: Metadata = {
  title: "Khagna — Best price & best card",
  description: "Compare grocery prices across local stores + find the best credit card for every purchase.",
};

function Nav() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/stores", label: "Stores" },
    { href: "/basket", label: "Basket" },
    { href: "/cards", label: "Cards" },
    { href: "/dashboard", label: "Dashboard" },
  ];
  return (
    <header className="sticky top-0 z-40">
      <div className="glass border-b border-emerald-100/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-lg font-black text-white shadow-lg shadow-emerald-500/30">
              খ
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Khagna
              <span className="ml-2 hidden rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 sm:inline">
                beta
              </span>
            </span>
          </Link>
          <nav className="hidden gap-1 text-sm font-medium md:flex">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3.5 py-1.5 text-gray-600 transition hover:bg-emerald-500 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="/stores"
            className="hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 md:inline-block"
          >
            Compare prices
          </a>
        </div>
      </div>
      {/* mobile bottom nav */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t border-emerald-100/60 py-2.5 text-xs font-semibold md:hidden">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="rounded-full px-3 py-1.5 text-gray-700 active:bg-emerald-100">
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Google tag (gtag.js) */}
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="mt-8 border-t border-emerald-100 bg-white/70 py-6 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center text-xs text-gray-500 md:flex-row md:justify-between md:text-left">
            <p>
              <b className="text-gray-700">Khagna</b> — pay the least, every time.
            </p>
            <p>Scraped prices win over manual · images via Cloudinary (aggressively compressed)</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

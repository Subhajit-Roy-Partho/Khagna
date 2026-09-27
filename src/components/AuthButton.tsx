"use client";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const MENU = [
  { href: "/dashboard", icon: "📊", label: "Dashboard", desc: "Comments, stores & crawls" },
  { href: "/cards", icon: "💳", label: "My cards", desc: "Best card for every shop" },
  { href: "/basket", icon: "🧺", label: "Basket", desc: "Cheapest split across stores" },
  { href: "/settings", icon: "⚙️", label: "Settings", desc: "Location, cards & account" },
];

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  if (status === "loading") {
    return <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-gray-400">…</span>;
  }
  if (!session?.user) {
    return (
      <a
        href="/signin"
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
      >
        Sign in
      </a>
    );
  }
  const u = session.user as { name?: string; image?: string; email?: string };
  const initial = (u.name || u.email || "?")[0]?.toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={u.name || u.email || "Account"}
        className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-2 transition hover:shadow-md ${open ? "border-emerald-400 bg-emerald-50" : "border-zinc-200 bg-white"}`}
      >
        {u.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar hotlink
          <img src={u.image} alt="" className="h-8 w-8 rounded-full border" />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline">
          {u.name || u.email}
        </span>
        <span className="text-xs text-gray-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center gap-3 border-b bg-emerald-50/60 p-3">
            {u.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar hotlink
              <img src={u.image} alt="" className="h-10 w-10 rounded-full border" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-base font-bold text-white">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{u.name || "Khagna user"}</p>
              {u.email && <p className="truncate text-xs text-gray-500">{u.email}</p>}
            </div>
          </div>
          <div className="p-1.5">
            {MENU.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-emerald-50"
              >
                <span className="text-lg">{m.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block text-xs text-gray-500">{m.desc}</span>
                </span>
              </Link>
            ))}
          </div>
          <div className="border-t p-1.5">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50"
            >
              <span className="text-lg">⎋</span>
              <span>
                <span className="block text-sm font-semibold">Sign out</span>
                <span className="block text-xs text-gray-500">See you next shop</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

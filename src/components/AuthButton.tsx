"use client";
import { signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();
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
  return (
    <span className="flex items-center gap-2">
      {u.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar hotlink
        <img src={u.image} alt={u.name || "user"} className="h-8 w-8 rounded-full border" />
      ) : (
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">
          {(u.name || u.email || "?")[0]?.toUpperCase()}
        </span>
      )}
      <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline">
        {u.name || u.email}
      </span>
      <button onClick={() => signOut()} className="rounded-full border px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-zinc-100">
        Out
      </button>
    </span>
  );
}

"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "up") {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const j = await r.json();
        if (!j.ok) {
          setMsg(j.error || "Registration failed.");
          return;
        }
      }
      const res = await signIn("credentials", { email, password, callbackUrl: "/", redirect: false });
      if (res?.error) setMsg("Invalid email or password.");
      else router.push("/");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-3xl border bg-white p-6 md:p-8">
      <h1 className="text-xl font-extrabold">Sign in to Khagna</h1>
      <p className="mt-1 text-sm text-gray-500">Only signed-in users can correct prices, comment, or add stores & cards.</p>

      <div className="mt-4 grid gap-2">
        <button onClick={() => signIn("github", { callbackUrl: "/" })} className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-black">
          Continue with GitHub
        </button>
        <button onClick={() => signIn("google", { callbackUrl: "/" })} className="rounded-full border px-4 py-2.5 text-sm font-bold hover:bg-zinc-50">
          Continue with Google
        </button>
      </div>

      <div className="my-4 flex items-center gap-2 text-xs text-gray-400">
        <span className="h-px flex-1 bg-zinc-200" /> or with email <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="mb-3 flex rounded-full bg-zinc-100 p-1 text-sm font-semibold">
        {(["in", "up"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-1.5 ${mode === m ? "bg-white shadow" : "text-gray-500"}`}>
            {m === "in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="grid gap-2">
        {mode === "up" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="rounded border px-3 py-2 text-sm" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required className="rounded border px-3 py-2 text-sm" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (8+ chars)" type="password" required minLength={8} className="rounded border px-3 py-2 text-sm" />
        <button disabled={busy} className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy ? "…" : mode === "in" ? "Sign in with email" : "Create account & sign in"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}
    </motion.div>
  );
}

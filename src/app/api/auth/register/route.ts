import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, initDb } from "@/lib/db";

// POST /api/auth/register {name, email, password} — create a password account.
// Open registration (no auth needed); rate-limiting is left to the platform.
export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { name, email, password } = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const cleanEmail = String(email || "").toLowerCase().trim();
    if (!cleanEmail.includes("@")) {
      return NextResponse.json({ ok: false, error: "Valid email required." }, { status: 400 });
    }
    if (String(password || "").length < 8) {
      return NextResponse.json({ ok: false, error: "Password must be 8+ characters." }, { status: 400 });
    }
    const db = getDb();
    const existing = (
      await db.execute({ sql: "SELECT id FROM users WHERE email=? LIMIT 1", args: [cleanEmail] })
    ).rows[0];
    if (existing) {
      return NextResponse.json({ ok: false, error: "Email already registered — sign in instead." }, { status: 409 });
    }
    const hash = await bcrypt.hash(String(password), 10);
    await db.execute({
      sql: "INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
      args: [String(name || "").slice(0, 80) || cleanEmail, cleanEmail, hash],
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

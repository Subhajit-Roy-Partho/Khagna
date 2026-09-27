import { NextResponse } from "next/server";
import { requireUser } from "@/lib/require-user";
import { seedUsaCards } from "@/lib/seed-usa";
import { USA_CARDS_REFRESHED } from "@/lib/usa-cards";

// POST /api/seed-usa-cards — idempotent upsert of the curated USA catalog (auth).
export async function POST() {
  try {
    const auth = await requireUser();
    if ("error" in auth) return auth.error;
    const counts = await seedUsaCards();
    return NextResponse.json({ ok: true, refreshed: USA_CARDS_REFRESHED, ...counts });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

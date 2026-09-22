import { getDb, initDb } from "@/lib/db";
import Link from "next/link";
import CardDetailClient from "./client";

export const dynamic = "force-dynamic";

async function getCard(id: number) {
  await initDb();
  const db = getDb();
  const card = (
    await db.execute({ sql: "SELECT * FROM cards WHERE id=? LIMIT 1", args: [id] })
  ).rows[0] as unknown as Record<string, unknown> | undefined;
  if (!card) return null;
  const benefits = (
    await db.execute({ sql: "SELECT * FROM card_benefits WHERE card_id=? ORDER BY reward_rate DESC", args: [id] })
  ).rows as unknown as Record<string, unknown>[];
  return { card, benefits };
}

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCard(Number(id));
  if (!data) {
    return (
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="font-bold">Card not found.</p>
        <Link href="/cards" className="text-sm text-emerald-700">← Back to cards</Link>
      </div>
    );
  }
  return <CardDetailClient card={data.card} benefits={data.benefits} />;
}

import { NextRequest, NextResponse } from "next/server";
import { uploadAggressive } from "@/lib/cloudinary";

// POST multipart/form-data with `file` field. Returns aggressively compressed URL.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "no file" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadAggressive(buf, "khagna");
    return NextResponse.json({ ok: true, url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

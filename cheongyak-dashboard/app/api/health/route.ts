import { NextResponse } from "next/server";
import { db, initSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initSchema();
    await db.execute("SELECT 1");
    return NextResponse.json({ ok: true, db: "connected", ts: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

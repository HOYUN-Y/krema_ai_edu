import { NextRequest, NextResponse } from "next/server";
import { getAnnouncementsFromDB } from "@/lib/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page   = Number(sp.get("page") ?? 1);
    const perPage = Number(sp.get("perPage") ?? 20);
    const filter = sp.get("filter") ?? "전체";

    const data = await getAnnouncementsFromDB(filter, page, perPage);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

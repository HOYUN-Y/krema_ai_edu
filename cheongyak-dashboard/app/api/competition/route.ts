import { NextRequest, NextResponse } from "next/server";
import { getCompetitionFromDB } from "@/lib/sync";
import { getSpecialSupply } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page   = Number(sp.get("page") ?? 1);
    const filter = sp.get("filter") ?? "전체";

    const [competition, special] = await Promise.all([
      getCompetitionFromDB(filter, page),
      getSpecialSupply(),
    ]);

    return NextResponse.json({ competition, special });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

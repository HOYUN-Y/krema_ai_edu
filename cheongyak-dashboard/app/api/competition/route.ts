import { NextRequest, NextResponse } from "next/server";
import { getAPTCompetition, getSpecialSupply } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const houseManageNo = req.nextUrl.searchParams.get("id") ?? undefined;
    const [competition, special] = await Promise.all([
      getAPTCompetition(page, houseManageNo),
      getSpecialSupply(page),
    ]);
    return NextResponse.json({ competition, special });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

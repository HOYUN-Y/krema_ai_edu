import { NextRequest, NextResponse } from "next/server";
import { getCompetition, getSpecialSupply } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const [competition, special] = await Promise.all([
      getCompetition(page),
      getSpecialSupply(page),
    ]);
    return NextResponse.json({ competition, special });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

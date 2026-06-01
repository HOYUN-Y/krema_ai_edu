import { NextRequest, NextResponse } from "next/server";
import { getReqstAreaStat, getPrzwnerAreaStat } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const [reqst, przwner] = await Promise.all([
      getReqstAreaStat(page),
      getPrzwnerAreaStat(page),
    ]);
    return NextResponse.json({ reqst, przwner });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

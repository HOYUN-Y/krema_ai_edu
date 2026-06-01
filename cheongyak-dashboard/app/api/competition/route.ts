import { NextRequest, NextResponse } from "next/server";
import { getCompetition } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id") ?? "";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data = await getCompetition(id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

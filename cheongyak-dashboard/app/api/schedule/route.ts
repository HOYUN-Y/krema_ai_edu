import { NextRequest, NextResponse } from "next/server";
import { getAPTAnnouncements } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const data = await getAPTAnnouncements(page, "50");
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

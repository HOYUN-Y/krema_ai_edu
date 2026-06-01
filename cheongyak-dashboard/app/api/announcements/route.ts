import { NextRequest, NextResponse } from "next/server";
import { getAPTAnnouncements } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const perPage = req.nextUrl.searchParams.get("perPage") ?? "20";
    const data = await getAPTAnnouncements(page, perPage);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

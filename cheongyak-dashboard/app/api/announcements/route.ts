import { NextRequest, NextResponse } from "next/server";
import { getAPTAnnouncements, FilterType } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const page = req.nextUrl.searchParams.get("page") ?? "1";
    const perPage = req.nextUrl.searchParams.get("perPage") ?? "20";
    const filter = (req.nextUrl.searchParams.get("filter") ?? "전체") as FilterType;
    const data = await getAPTAnnouncements(page, perPage, filter);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

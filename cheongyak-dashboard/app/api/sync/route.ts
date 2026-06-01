import { NextResponse } from "next/server";
import { syncAll } from "@/lib/sync";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const start = Date.now();
    await syncAll();
    const elapsed = Date.now() - start;

    // 동기화 결과 요약
    const logResult = await db.execute(
      `SELECT api_name, rows_synced, status, synced_at
       FROM sync_log
       WHERE synced_at >= ?
       ORDER BY synced_at DESC`,
      [Math.floor(start / 1000)]
    );

    return NextResponse.json({
      ok: true,
      elapsed_ms: elapsed,
      logs: logResult.rows,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 최근 동기화 현황 조회
    const result = await db.execute(`
      SELECT api_name,
             MAX(synced_at) as last_synced,
             MAX(CASE WHEN status = 'ok' THEN rows_synced ELSE 0 END) as last_rows,
             SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count
      FROM sync_log
      GROUP BY api_name
      ORDER BY last_synced DESC
    `);

    const counts = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM apt_announcements) as announcements,
        (SELECT COUNT(*) FROM apt_competitions)  as competitions,
        (SELECT COUNT(*) FROM reqst_area_stats)  as reqst_stats,
        (SELECT COUNT(*) FROM przwner_area_stats) as przwner_stats
    `);

    return NextResponse.json({
      db_counts: counts.rows[0],
      sync_status: result.rows,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

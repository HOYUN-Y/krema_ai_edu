import { NextRequest, NextResponse } from "next/server";
import { syncAll } from "@/lib/sync";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Cron 타임아웃 최대 300초
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // ── 보안: Authorization 헤더 또는 secret 쿼리 파라미터 확인 ──
  const cronSecret = process.env.CRON_SECRET ?? "";

  const authHeader = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` ||
    (querySecret && querySecret === cronSecret);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const start = Date.now();

  try {
    await syncAll();

    const elapsed = Date.now() - start;

    // 동기화 결과 조회
    const logResult = await db.execute(
      `SELECT api_name, rows_synced, status, message, synced_at
       FROM sync_log
       WHERE synced_at >= ?
       ORDER BY synced_at DESC`,
      [Math.floor(start / 1000) - 5]
    );

    const countResult = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM apt_announcements) as announcements,
        (SELECT COUNT(*) FROM apt_competitions)  as competitions,
        (SELECT COUNT(*) FROM reqst_area_stats)  as reqst_stats,
        (SELECT COUNT(*) FROM przwner_area_stats) as przwner_stats
    `);

    console.log(`[CRON] 동기화 완료 ${elapsed}ms`, logResult.rows);

    return NextResponse.json({
      ok: true,
      started_at: startedAt,
      elapsed_ms: elapsed,
      db_counts: countResult.rows[0],
      logs: logResult.rows,
    });
  } catch (e) {
    console.error("[CRON] 동기화 실패", e);
    return NextResponse.json(
      { ok: false, error: String(e), started_at: startedAt },
      { status: 500 }
    );
  }
}

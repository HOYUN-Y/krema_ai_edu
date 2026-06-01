/**
 * DB-first 전략 동기화 모듈
 *
 * 흐름:
 *   1. isStale() 로 TTL 확인
 *   2. 신선하면 → DB에서 반환
 *   3. 오래됐으면 → 공공API 호출 → DB upsert → 반환
 */

import { db, initSchema, isStale, logSync, now } from "./db";
import {
  getAPTAnnouncements,
  getAPTCompetition,
  getReqstAreaStat,
  getPrzwnerAreaStat,
} from "./api";

// TTL 설정 (초)
const TTL = {
  announcements: 15 * 60,   // 15분
  competition:    5 * 60,   // 5분
  stats:         60 * 60,   // 60분 (매월 26일 갱신)
};

let schemaReady = false;
async function ensureSchema() {
  if (schemaReady) return;
  await initSchema();
  schemaReady = true;
}

// ── 분양정보 ───────────────────────────────────────────────────

export async function getAnnouncementsFromDB(filter = "전체", page = 1, perPage = 20) {
  await ensureSchema();

  if (await isStale("announcements", TTL.announcements)) {
    await syncAnnouncements();
  }

  // DB에서 필터링 쿼리
  let whereClauses = ["1=1"];
  const args: (string | number)[] = [];

  if (filter === "수도권") {
    whereClauses.push("sido IN ('서울', '경기', '인천')");
  } else if (filter === "민영") {
    whereClauses.push("house_dtl_secd = '01'");
  }

  const where = whereClauses.join(" AND ");
  const offset = (page - 1) * perPage;

  const [countResult, rowsResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as cnt FROM apt_announcements WHERE ${where}`, args }),
    db.execute({ sql: `SELECT raw_json FROM apt_announcements WHERE ${where} ORDER BY fetched_at DESC LIMIT ? OFFSET ?`, args: [...args, perPage, offset] }),
  ]);

  const matchCount = Number(countResult.rows[0].cnt);
  const items = rowsResult.rows.map(r => JSON.parse(String(r.raw_json)));

  return { matchCount, filteredCount: items.length, items, source: "db" as const };
}

async function syncAnnouncements() {
  try {
    // 여러 페이지 병렬로 가져오기 (최대 5페이지 = 100건)
    const pages = await Promise.all(
      [1, 2, 3, 4, 5].map(p => getAPTAnnouncements(String(p), "20"))
    );
    const allItems = pages.flatMap(p => p.items);

    if (allItems.length === 0) {
      await logSync("announcements", 0, "ok", "no data");
      return;
    }

    // upsert
    for (const item of allItems) {
      await db.execute({
        sql: `INSERT INTO apt_announcements
          (house_manage_no, pblanc_no, house_nm, sido, house_dtl_secd, house_dtl_secd_nm,
           tot_suply_hshldco, rcpt_bgnde, rcpt_endde, przwner_de, raw_json, fetched_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(house_manage_no) DO UPDATE SET
            pblanc_no = excluded.pblanc_no,
            house_nm = excluded.house_nm,
            sido = excluded.sido,
            house_dtl_secd = excluded.house_dtl_secd,
            house_dtl_secd_nm = excluded.house_dtl_secd_nm,
            tot_suply_hshldco = excluded.tot_suply_hshldco,
            rcpt_bgnde = excluded.rcpt_bgnde,
            rcpt_endde = excluded.rcpt_endde,
            przwner_de = excluded.przwner_de,
            raw_json = excluded.raw_json,
            fetched_at = excluded.fetched_at`,
        args: [
          String(item.HOUSE_MANAGE_NO ?? ""),
          String(item.PBLANC_NO ?? ""),
          String(item.HOUSE_NM ?? ""),
          String(item.SUBSCRPT_AREA_CODE_NM ?? ""),
          String(item.HOUSE_DTL_SECD ?? ""),
          String(item.HOUSE_DTL_SECD_NM ?? ""),
          Number(item.TOT_SUPLY_HSHLDCO ?? 0),
          String(item.GNRL_RNK1_CRSPAREA_RCPTDE ?? ""),
          String(item.GNRL_RNK1_CRSPAREA_ENDDE ?? ""),
          String(item.PRZWNER_PRESNATN_DE ?? ""),
          JSON.stringify(item),
          now(),
        ],
      });
    }

    await logSync("announcements", allItems.length, "ok");
  } catch (e) {
    await logSync("announcements", 0, "error", String(e));
  }
}

// ── 경쟁률 ────────────────────────────────────────────────────

export async function getCompetitionFromDB(filter = "전체", page = 1, perPage = 20) {
  await ensureSchema();

  if (await isStale("competition", TTL.competition)) {
    await syncCompetition();
  }

  let whereClauses = ["1=1"];
  const args: (string | number)[] = [];

  if (filter === "수도권") {
    // 경쟁률 테이블에는 지역 정보 없음 → raw_json에서 매칭
    whereClauses.push("(raw_json LIKE '%\"SUBSCRPT_AREA_CODE_NM\":\"서울\"%' OR raw_json LIKE '%\"SUBSCRPT_AREA_CODE_NM\":\"경기\"%' OR raw_json LIKE '%\"SUBSCRPT_AREA_CODE_NM\":\"인천\"%')");
  }

  const where = whereClauses.join(" AND ");
  const offset = (page - 1) * perPage;

  const [countResult, rowsResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) as cnt FROM apt_competitions WHERE ${where}`, args }),
    db.execute({ sql: `SELECT raw_json FROM apt_competitions WHERE ${where} ORDER BY fetched_at DESC LIMIT ? OFFSET ?`, args: [...args, perPage, offset] }),
  ]);

  const matchCount = Number(countResult.rows[0].cnt);
  const items = rowsResult.rows.map(r => JSON.parse(String(r.raw_json)));

  return { matchCount, filteredCount: items.length, items, source: "db" as const };
}

async function syncCompetition() {
  try {
    const pages = await Promise.all(
      [1, 2, 3].map(p => getAPTCompetition(String(p)))
    );
    const allItems = pages.flatMap(p => p.items);

    for (const item of allItems) {
      await db.execute({
        sql: `INSERT INTO apt_competitions
          (house_manage_no, pblanc_no, house_ty, model_no, rank_code, reside_secd,
           reside_senm, suply_hshldco, req_cnt, cmpet_rate, raw_json, fetched_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(house_manage_no, house_ty, model_no, rank_code, reside_secd) DO UPDATE SET
            req_cnt = excluded.req_cnt,
            cmpet_rate = excluded.cmpet_rate,
            raw_json = excluded.raw_json,
            fetched_at = excluded.fetched_at`,
        args: [
          String(item.HOUSE_MANAGE_NO ?? ""),
          String(item.PBLANC_NO ?? ""),
          String(item.HOUSE_TY ?? ""),
          String(item.MODEL_NO ?? ""),
          Number(item.SUBSCRPT_RANK_CODE ?? 0),
          String(item.RESIDE_SECD ?? ""),
          String(item.RESIDE_SENM ?? ""),
          Number(item.SUPLY_HSHLDCO ?? 0),
          Number(item.REQ_CNT ?? 0),
          String(item.CMPET_RATE ?? ""),
          JSON.stringify(item),
          now(),
        ],
      });
    }

    await logSync("competition", allItems.length, "ok");
  } catch (e) {
    await logSync("competition", 0, "error", String(e));
  }
}

// ── 신청·당첨 통계 ──────────────────────────────────────────────

export async function getStatsFromDB() {
  await ensureSchema();

  const [reqStale, przStale] = await Promise.all([
    isStale("reqst_stats", TTL.stats),
    isStale("przwner_stats", TTL.stats),
  ]);

  if (reqStale) await syncReqstStats();
  if (przStale) await syncPrzwnerStats();

  const [reqResult, przResult] = await Promise.all([
    db.execute(`SELECT raw_json FROM reqst_area_stats ORDER BY stat_de DESC, area_nm ASC`),
    db.execute(`SELECT raw_json FROM przwner_area_stats ORDER BY stat_de DESC, area_nm ASC`),
  ]);

  return {
    reqst: {
      items: reqResult.rows.map(r => JSON.parse(String(r.raw_json))),
      source: "db" as const,
    },
    przwner: {
      items: przResult.rows.map(r => JSON.parse(String(r.raw_json))),
      source: "db" as const,
    },
  };
}

async function syncReqstStats() {
  try {
    const data = await getReqstAreaStat("1");
    for (const item of data.items) {
      await db.execute({
        sql: `INSERT INTO reqst_area_stats (stat_de, area_code, area_nm, age_30, age_40, age_50, age_60, raw_json, fetched_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(stat_de, area_code) DO UPDATE SET
                age_30 = excluded.age_30, age_40 = excluded.age_40,
                age_50 = excluded.age_50, age_60 = excluded.age_60,
                raw_json = excluded.raw_json, fetched_at = excluded.fetched_at`,
        args: [
          String(item.STAT_DE ?? ""), String(item.SUBSCRPT_AREA_CODE ?? ""),
          String(item.SUBSCRPT_AREA_CODE_NM ?? ""),
          Number(item.AGE_30 ?? 0), Number(item.AGE_40 ?? 0),
          Number(item.AGE_50 ?? 0), Number(item.AGE_60 ?? 0),
          JSON.stringify(item), now(),
        ],
      });
    }
    await logSync("reqst_stats", data.items.length, "ok");
  } catch (e) {
    await logSync("reqst_stats", 0, "error", String(e));
  }
}

async function syncPrzwnerStats() {
  try {
    const data = await getPrzwnerAreaStat("1");
    for (const item of data.items) {
      await db.execute({
        sql: `INSERT INTO przwner_area_stats (stat_de, area_code, area_nm, age_30, age_40, age_50, age_60, raw_json, fetched_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(stat_de, area_code) DO UPDATE SET
                age_30 = excluded.age_30, age_40 = excluded.age_40,
                age_50 = excluded.age_50, age_60 = excluded.age_60,
                raw_json = excluded.raw_json, fetched_at = excluded.fetched_at`,
        args: [
          String(item.STAT_DE ?? ""), String(item.SUBSCRPT_AREA_CODE ?? ""),
          String(item.SUBSCRPT_AREA_CODE_NM ?? ""),
          Number(item.AGE_30 ?? 0), Number(item.AGE_40 ?? 0),
          Number(item.AGE_50 ?? 0), Number(item.AGE_60 ?? 0),
          JSON.stringify(item), now(),
        ],
      });
    }
    await logSync("przwner_stats", data.items.length, "ok");
  } catch (e) {
    await logSync("przwner_stats", 0, "error", String(e));
  }
}

// ── 수동 전체 동기화 ────────────────────────────────────────────
export async function syncAll() {
  await ensureSchema();
  await Promise.all([
    syncAnnouncements(),
    syncCompetition(),
    syncReqstStats(),
    syncPrzwnerStats(),
  ]);
}

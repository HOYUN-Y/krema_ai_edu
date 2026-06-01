/**
 * Turso (libSQL) 클라이언트 + 스키마 초기화
 * - 로컬: TURSO_DATABASE_URL 미설정 시 ./local.db (SQLite 파일)
 * - 프로덕션: Turso 클라우드 (libsql://...)
 */

import { createClient } from "@libsql/client";

// 싱글톤 (Next.js HMR 중복 방지)
const g = globalThis as typeof globalThis & { __tursoClient?: ReturnType<typeof createClient> };

function getClient() {
  if (g.__tursoClient) return g.__tursoClient;

  const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  g.__tursoClient = createClient({ url, authToken });
  return g.__tursoClient;
}

export const db = getClient();

// ── 스키마 초기화 ──────────────────────────────────────────────
export async function initSchema() {
  // ALTER TABLE은 에러 무시 (이미 컬럼 존재 시)
  for (const sql of [
    "ALTER TABLE reqst_area_stats ADD COLUMN raw_json TEXT NOT NULL DEFAULT '{}'",
    "ALTER TABLE przwner_area_stats ADD COLUMN raw_json TEXT NOT NULL DEFAULT '{}'",
  ]) {
    try { await db.execute(sql); } catch { /* 이미 존재 */ }
  }

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS apt_announcements (
      house_manage_no TEXT PRIMARY KEY,
      pblanc_no       TEXT,
      house_nm        TEXT,
      sido            TEXT,
      house_dtl_secd  TEXT,
      house_dtl_secd_nm TEXT,
      tot_suply_hshldco INTEGER,
      rcpt_bgnde      TEXT,
      rcpt_endde      TEXT,
      przwner_de      TEXT,
      raw_json        TEXT NOT NULL,
      fetched_at      INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS apt_competitions (
      id              INTEGER PRIMARY KEY,
      house_manage_no TEXT NOT NULL,
      pblanc_no       TEXT,
      house_ty        TEXT,
      model_no        TEXT,
      rank_code       INTEGER,
      reside_secd     TEXT,
      reside_senm     TEXT,
      suply_hshldco   INTEGER,
      req_cnt         INTEGER,
      cmpet_rate      TEXT,
      raw_json        TEXT NOT NULL,
      fetched_at      INTEGER NOT NULL,
      UNIQUE(house_manage_no, house_ty, model_no, rank_code, reside_secd)
    );

    CREATE TABLE IF NOT EXISTS reqst_area_stats (
      id              INTEGER PRIMARY KEY,
      stat_de         TEXT NOT NULL,
      area_code       TEXT NOT NULL,
      area_nm         TEXT,
      age_30          INTEGER DEFAULT 0,
      age_40          INTEGER DEFAULT 0,
      age_50          INTEGER DEFAULT 0,
      age_60          INTEGER DEFAULT 0,
      raw_json        TEXT NOT NULL DEFAULT '{}',
      fetched_at      INTEGER NOT NULL,
      UNIQUE(stat_de, area_code)
    );

    CREATE TABLE IF NOT EXISTS przwner_area_stats (
      id              INTEGER PRIMARY KEY,
      stat_de         TEXT NOT NULL,
      area_code       TEXT NOT NULL,
      area_nm         TEXT,
      age_30          INTEGER DEFAULT 0,
      age_40          INTEGER DEFAULT 0,
      age_50          INTEGER DEFAULT 0,
      age_60          INTEGER DEFAULT 0,
      raw_json        TEXT NOT NULL DEFAULT '{}',
      fetched_at      INTEGER NOT NULL,
      UNIQUE(stat_de, area_code)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id          INTEGER PRIMARY KEY,
      api_name    TEXT NOT NULL,
      rows_synced INTEGER DEFAULT 0,
      status      TEXT NOT NULL,
      message     TEXT,
      synced_at   INTEGER NOT NULL
    );
  `);
}

// ── 헬퍼 ──────────────────────────────────────────────────────
export function now() { return Math.floor(Date.now() / 1000); }

/** TTL(초) 이내에 마지막 동기화가 있었는지 확인 */
export async function isStale(apiName: string, ttlSec: number): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT synced_at FROM sync_log WHERE api_name = ? AND status = 'ok' ORDER BY synced_at DESC LIMIT 1`,
    args: [apiName],
  });
  if (!result.rows.length) return true;
  const lastSync = Number(result.rows[0].synced_at);
  return now() - lastSync > ttlSec;
}

export async function logSync(apiName: string, rowsSynced: number, status: "ok" | "error", message = "") {
  await db.execute({
    sql: `INSERT INTO sync_log (api_name, rows_synced, status, message, synced_at) VALUES (?, ?, ?, ?, ?)`,
    args: [apiName, rowsSynced, status, message, now()],
  });
}

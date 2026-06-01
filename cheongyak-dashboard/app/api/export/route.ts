import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db, initSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 컬럼 한글 레이블
const COLUMNS: Record<string, Record<string, string>> = {
  announcements: {
    HOUSE_MANAGE_NO: "주택관리번호",
    PBLANC_NO: "공고번호",
    HOUSE_NM: "단지명",
    SUBSCRPT_AREA_CODE_NM: "공급지역",
    HOUSE_SECD_NM: "주택구분",
    HOUSE_DTL_SECD_NM: "주택상세구분",
    RENT_SECD_NM: "분양구분",
    TOT_SUPLY_HSHLDCO: "공급규모(세대)",
    GNRL_RNK1_CRSPAREA_RCPTDE: "1순위 해당지역 접수일",
    GNRL_RNK1_CRSPAREA_ENDDE: "1순위 해당지역 마감일",
    GNRL_RNK2_CRSPAREA_RCPTDE: "2순위 해당지역 접수일",
    GNRL_RNK2_CRSPAREA_ENDDE: "2순위 해당지역 마감일",
    PRZWNER_PRESNATN_DE: "당첨자 발표일",
    CNTRCT_CNCLS_BGNDE: "계약 시작일",
    CNTRCT_CNCLS_ENDDE: "계약 종료일",
    HSSPLY_ADRES: "공급위치",
    BSNS_MBY_NM: "사업주체명",
    CNSTRCT_ENTRPS_NM: "시공사명",
    HMPG_ADRES: "홈페이지 주소",
  },
  competitions: {
    HOUSE_MANAGE_NO: "주택관리번호",
    PBLANC_NO: "공고번호",
    HOUSE_TY: "주택형",
    MODEL_NO: "모델번호",
    SUBSCRPT_RANK_CODE: "청약순위",
    RESIDE_SECD: "거주구분코드",
    RESIDE_SENM: "거주구분명",
    SUPLY_HSHLDCO: "공급세대수",
    REQ_CNT: "접수건수",
    CMPET_RATE: "경쟁률",
  },
  reqst_stats: {
    STAT_DE: "기준연월",
    SUBSCRPT_AREA_CODE: "공급지역코드",
    SUBSCRPT_AREA_CODE_NM: "공급지역명",
    AGE_30: "30대이하",
    AGE_40: "40대",
    AGE_50: "50대",
    AGE_60: "60대이상",
  },
  przwner_stats: {
    STAT_DE: "기준연월",
    SUBSCRPT_AREA_CODE: "공급지역코드",
    SUBSCRPT_AREA_CODE_NM: "공급지역명",
    AGE_30: "30대이하",
    AGE_40: "40대",
    AGE_50: "50대",
    AGE_60: "60대이상",
  },
};

export async function GET(req: NextRequest) {
  try {
    await initSchema();
    const sp = req.nextUrl.searchParams;

    const dataset  = sp.get("dataset") ?? "announcements";   // announcements|competitions|reqst_stats|przwner_stats
    const format   = sp.get("format") ?? "csv";               // csv|xlsx
    const region   = sp.get("region") ?? "";                  // 지역명 (빈값=전체)
    const dateFrom = sp.get("from") ?? "";                    // YYYYMM or YYYY-MM-DD
    const dateTo   = sp.get("to") ?? "";
    const houseType = sp.get("houseType") ?? "";              // 01=민영, 03=국민

    // ── 쿼리 조건 ─────────────────────────────────────────────
    const where: string[] = ["1=1"];
    const args: (string | number)[] = [];

    if (dataset === "announcements") {
      if (region)    { where.push("sido = ?");         args.push(region); }
      if (houseType) { where.push("house_dtl_secd = ?"); args.push(houseType); }
      if (dateFrom)  { where.push("rcpt_bgnde >= ?");  args.push(dateFrom); }
      if (dateTo)    { where.push("rcpt_bgnde <= ?");  args.push(dateTo); }
    } else if (dataset === "competitions") {
      // competitions는 raw_json에서 필터
      if (region) {
        where.push("raw_json LIKE ?");
        args.push(`%"SUBSCRPT_AREA_CODE_NM":"${region}"%`);
      }
    } else {
      // reqst_stats / przwner_stats
      if (region)   { where.push("area_nm = ?");  args.push(region); }
      if (dateFrom) { where.push("stat_de >= ?"); args.push(dateFrom.replace(/-/g, "").slice(0, 6)); }
      if (dateTo)   { where.push("stat_de <= ?"); args.push(dateTo.replace(/-/g, "").slice(0, 6)); }
    }

    const tableName = {
      announcements: "apt_announcements",
      competitions:  "apt_competitions",
      reqst_stats:   "reqst_area_stats",
      przwner_stats: "przwner_area_stats",
    }[dataset] ?? "apt_announcements";

    const result = await db.execute({
      sql: `SELECT raw_json FROM ${tableName} WHERE ${where.join(" AND ")} ORDER BY fetched_at DESC LIMIT 10000`,
      args,
    });

    const rows = result.rows.map(r => JSON.parse(String(r.raw_json)));
    if (rows.length === 0) {
      return NextResponse.json({ error: "조건에 맞는 데이터가 없습니다." }, { status: 404 });
    }

    // ── 컬럼 정렬 + 한글 헤더 ──────────────────────────────────
    const colMap = COLUMNS[dataset] ?? {};
    const colKeys = Object.keys(colMap);

    const exportRows = rows.map(row => {
      const out: Record<string, string | number> = {};
      colKeys.forEach(k => {
        const label = colMap[k];
        out[label] = row[k] ?? "";
      });
      // colMap에 없는 필드도 포함
      Object.keys(row).forEach(k => {
        if (!colKeys.includes(k)) out[k] = row[k] ?? "";
      });
      return out;
    });

    const datasetLabel: Record<string, string> = {
      announcements: "분양정보",
      competitions:  "경쟁률",
      reqst_stats:   "신청자통계",
      przwner_stats: "당첨자통계",
    };
    const filename = `청약_${datasetLabel[dataset] ?? dataset}_${new Date().toISOString().slice(0, 10)}`;

    // ── CSV ────────────────────────────────────────────────────
    if (format === "csv") {
      const headers = Object.keys(exportRows[0]);
      const lines = [
        headers.join(","),
        ...exportRows.map(r =>
          headers.map(h => {
            const v = String(r[h] ?? "");
            return v.includes(",") || v.includes('"') || v.includes("\n")
              ? `"${v.replace(/"/g, '""')}"`
              : v;
          }).join(",")
        ),
      ];
      const csvContent = "﻿" + lines.join("\r\n"); // BOM for Excel
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.csv`,
        },
      });
    }

    // ── XLSX ───────────────────────────────────────────────────
    const ws = XLSX.utils.json_to_sheet(exportRows);
    // 컬럼 너비 자동 조정
    const colWidths = Object.keys(exportRows[0]).map(k => ({
      wch: Math.max(k.length, ...exportRows.slice(0, 20).map(r => String(r[k] ?? "").length), 8),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, datasetLabel[dataset] ?? "데이터");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.xlsx`,
      },
    });

  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

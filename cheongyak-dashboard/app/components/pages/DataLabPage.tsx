"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DATASETS = [
  { value: "announcements", label: "📋 분양정보",     desc: "APT 분양 공고 목록, 접수일정, 공급세대 등" },
  { value: "competitions",  label: "📊 경쟁률",       desc: "주택형별·거주지역별 청약 경쟁률" },
  { value: "reqst_stats",   label: "👥 신청자 통계",  desc: "지역별·연령대별 청약 신청건수" },
  { value: "przwner_stats", label: "🏆 당첨자 통계",  desc: "지역별·연령대별 청약 당첨건수" },
];

const REGIONS = [
  "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산",
  "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const HOUSE_TYPES = [
  { value: "", label: "전체" },
  { value: "01", label: "민영" },
  { value: "03", label: "국민" },
];

type PreviewItem = Record<string, string | number>;

export default function DataLabPage() {
  const [dataset,   setDataset]   = useState("announcements");
  const [region,    setRegion]    = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [houseType, setHouseType] = useState("");
  const [format,    setFormat]    = useState<"csv" | "xlsx">("xlsx");
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // DB 현황
  const { data: syncData } = useSWR("/api/sync", fetcher, { refreshInterval: 30000 });
  const dbCounts = syncData?.db_counts ?? {};

  // 쿼리스트링 구성
  const buildQuery = () => {
    const params = new URLSearchParams({ dataset, format });
    if (region)    params.set("region", region);
    if (dateFrom)  params.set("from", dateFrom);
    if (dateTo)    params.set("to", dateTo);
    if (houseType && dataset === "announcements") params.set("houseType", houseType);
    return params.toString();
  };

  // 미리보기 URL
  const previewUrl = `/api/export?${buildQuery().replace(`format=${format}`, "format=csv")}&limit=5`;

  // 다운로드
  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/export?${buildQuery()}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "다운로드 실패");
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const cd   = res.headers.get("content-disposition") ?? "";
      const match = cd.match(/filename\*=UTF-8''(.+)/);
      a.href     = url;
      a.download = match ? decodeURIComponent(match[1]) : `청약_${dataset}_${new Date().toISOString().slice(0,10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  const currentDataset = DATASETS.find(d => d.value === dataset);

  // DB 건수 표시
  const countMap: Record<string, number> = {
    announcements: dbCounts.announcements ?? 0,
    competitions:  dbCounts.competitions  ?? 0,
    reqst_stats:   dbCounts.reqst_stats   ?? 0,
    przwner_stats: dbCounts.przwner_stats ?? 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 헤더 */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>데이터랩</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
          DB에 누적된 청약 데이터를 조건 필터링 후 CSV 또는 XLSX로 다운로드
        </p>
      </div>

      {/* DB 현황 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {DATASETS.map(d => (
          <div key={d.value}
            onClick={() => setDataset(d.value)}
            style={{
              background: dataset === d.value ? "#EFF6FF" : "var(--surface)",
              border: `2px solid ${dataset === d.value ? "#2563EB" : "var(--line)"}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all .15s",
            }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: dataset === d.value ? "#1D4ED8" : "var(--ink)" }}>
              {d.label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: dataset === d.value ? "#2563EB" : "#64748B", margin: "6px 0 4px", fontVariantNumeric: "tabular-nums" }}>
              {(countMap[d.value] ?? 0).toLocaleString()}
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginLeft: 4 }}>건</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.4 }}>{d.desc}</div>
          </div>
        ))}
      </div>

      {/* 필터 패널 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>
          {currentDataset?.label} 필터 조건
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {/* 지역 */}
          <div>
            <label style={labelStyle}>지역</label>
            <select value={region} onChange={e => setRegion(e.target.value)} style={selectStyle}>
              <option value="">전체</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* 주택구분 (분양정보만) */}
          {dataset === "announcements" && (
            <div>
              <label style={labelStyle}>주택구분</label>
              <select value={houseType} onChange={e => setHouseType(e.target.value)} style={selectStyle}>
                {HOUSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}

          {/* 기간 시작 */}
          <div>
            <label style={labelStyle}>
              {dataset === "reqst_stats" || dataset === "przwner_stats" ? "기준월 시작 (YYYYMM)" : "접수 시작일"}
            </label>
            <input
              type={dataset === "reqst_stats" || dataset === "przwner_stats" ? "text" : "date"}
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              placeholder={dataset === "reqst_stats" || dataset === "przwner_stats" ? "예: 202401" : ""}
              style={inputStyle}
            />
          </div>

          {/* 기간 종료 */}
          <div>
            <label style={labelStyle}>
              {dataset === "reqst_stats" || dataset === "przwner_stats" ? "기준월 종료 (YYYYMM)" : "접수 종료일"}
            </label>
            <input
              type={dataset === "reqst_stats" || dataset === "przwner_stats" ? "text" : "date"}
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              placeholder={dataset === "reqst_stats" || dataset === "przwner_stats" ? "예: 202412" : ""}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 필터 초기화 */}
        <button
          onClick={() => { setRegion(""); setDateFrom(""); setDateTo(""); setHouseType(""); }}
          style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
        >
          필터 초기화
        </button>
      </div>

      {/* 다운로드 패널 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 22, boxShadow: "var(--shadow)" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 16 }}>다운로드</div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {/* 포맷 선택 */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["xlsx", "csv"] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{
                fontSize: 13, fontWeight: 600, padding: "8px 20px", borderRadius: 10, cursor: "pointer",
                border: "1px solid " + (format === f ? "#2563EB" : "var(--line)"),
                background: format === f ? "#EFF6FF" : "var(--surface)",
                color: format === f ? "#1D4ED8" : "var(--muted)", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {f === "xlsx" ? "📊" : "📄"} {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              fontSize: 14, fontWeight: 700, padding: "10px 28px", borderRadius: 10, cursor: downloading ? "not-allowed" : "pointer",
              background: downloading ? "#94A3B8" : "#2563EB", color: "#fff",
              border: "none", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
              opacity: downloading ? 0.7 : 1, transition: "all .15s",
            }}
          >
            {downloading ? "⏳ 다운로드 중…" : `⬇️ ${format.toUpperCase()} 다운로드`}
          </button>

          {/* 미리보기 토글 */}
          <button
            onClick={() => setPreviewOpen(v => !v)}
            style={{ fontSize: 12, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: "inherit" }}
          >
            {previewOpen ? "미리보기 닫기" : "🔍 데이터 미리보기"}
          </button>
        </div>

        {/* 안내 */}
        <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg)", borderRadius: 8, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          💡 <b>XLSX</b>는 Excel에서 바로 열기 가능 · 한글 컬럼명 포함<br />
          💡 <b>CSV</b>는 UTF-8 BOM 포함 (Excel 한글 깨짐 방지)<br />
          ⚡ 최대 10,000건 다운로드 지원
        </div>
      </div>

      {/* 데이터 미리보기 */}
      {previewOpen && <DataPreview dataset={dataset} region={region} dateFrom={dateFrom} dateTo={dateTo} houseType={houseType} />}

      {/* 동기화 현황 */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>🔄 DB 동기화 현황</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {(syncData?.sync_status ?? []).map((s: { api_name: string; last_synced: number; last_rows: number }) => {
            const labelMap: Record<string, string> = {
              announcements: "분양정보", competition: "경쟁률",
              reqst_stats: "신청자통계", przwner_stats: "당첨자통계",
            };
            const lastSync = s.last_synced ? new Date(s.last_synced * 1000) : null;
            const timeStr = lastSync
              ? `${lastSync.getMonth() + 1}/${lastSync.getDate()} ${String(lastSync.getHours()).padStart(2, "0")}:${String(lastSync.getMinutes()).padStart(2, "0")}`
              : "-";
            return (
              <div key={s.api_name} style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>{labelMap[s.api_name] ?? s.api_name}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>{s.last_rows?.toLocaleString()}건</div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>최근: {timeStr}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 미리보기 컴포넌트
function DataPreview({ dataset, region, dateFrom, dateTo, houseType }: {
  dataset: string; region: string; dateFrom: string; dateTo: string; houseType: string;
}) {
  const params = new URLSearchParams({ dataset, format: "csv" });
  if (region)    params.set("region", region);
  if (dateFrom)  params.set("from", dateFrom);
  if (dateTo)    params.set("to", dateTo);
  if (houseType && dataset === "announcements") params.set("houseType", houseType);

  const { data, isLoading, error } = useSWR(`/api/export?${params}`, async (url) => {
    const res = await fetch(url);
    if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
    const text = await res.text();
    const lines = text.replace(/^﻿/, "").split("\r\n").filter(Boolean);
    const headers = lines[0].split(",");
    const rows = lines.slice(1, 6).map(line => {
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (const ch of line) {
        if (ch === '"') { inQ = !inQ; }
        else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
        else cur += ch;
      }
      cells.push(cur);
      return headers.map((h, i) => ({ h, v: cells[i] ?? "" }));
    });
    return { headers, rows };
  });

  if (isLoading) return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20 }}>
      <div style={{ height: 120, background: "var(--track)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );

  if (error || !data) return (
    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 14, padding: 16, fontSize: 13, color: "#DC2626" }}>
      ⚠️ {error?.message ?? "데이터가 없습니다"}
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 20, boxShadow: "var(--shadow)", overflowX: "auto" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>데이터 미리보기 (최대 5건)</div>
      <table style={{ width: "100%", fontSize: 11.5, borderCollapse: "collapse", whiteSpace: "nowrap" }}>
        <thead>
          <tr>
            {data.headers.slice(0, 10).map(h => (
              <th key={h} style={{ padding: "6px 10px", background: "var(--bg)", fontWeight: 700, color: "var(--muted)", borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
              {row.slice(0, 10).map(({ h, v }) => (
                <td key={h} style={{ padding: "6px 10px", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {v || <span style={{ color: "var(--muted)" }}>-</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.headers.length > 10 && (
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
          * 미리보기는 처음 10개 컬럼만 표시 (실제 다운로드에는 전체 {data.headers.length}개 컬럼 포함)
        </p>
      )}
    </div>
  );
}

// 공통 스타일
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)", fontFamily: "inherit", cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)",
  background: "var(--surface)", fontSize: 13, color: "var(--ink)", fontFamily: "inherit",
  boxSizing: "border-box",
};

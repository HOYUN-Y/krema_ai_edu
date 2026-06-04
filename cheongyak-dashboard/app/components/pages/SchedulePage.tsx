"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, StatusPill, fmt } from "../ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

const today = new Date();
today.setHours(0, 0, 0, 0);

function parseDate(s: string | number | undefined): Date | null {
  if (!s) return null;
  const d = new Date(String(s));
  return isNaN(d.getTime()) ? null : d;
}

function getStatus(item: Item): string {
  const start = parseDate(item.GNRL_RNK1_CRSPAREA_RCPTDE as string);
  const end = parseDate(item.GNRL_RNK1_CRSPAREA_ENDDE as string);
  if (!start) return "접수예정";
  if (start > today) return "접수예정";
  if (end && end < today) return "마감";
  return "접수중";
}

export default function SchedulePage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("전체");
  const [regionFilter, setRegionFilter] = useState("전체");

  const { data, isLoading } = useSWR(`/api/schedule?page=${page}`, fetcher);
  const items: Item[] = data?.items ?? [];
  const totalCount: number = data?.totalCount ?? 0;

  // 지역 목록
  const regions = ["전체", ...Array.from(new Set(items.map(i => String(i.SUBSCRPT_AREA_CODE_NM ?? "")).filter(Boolean)))];

  // 필터 적용
  const filtered = items.filter(i => {
    const statusMatch = statusFilter === "전체" || getStatus(i) === statusFilter;
    const regionMatch = regionFilter === "전체" || i.SUBSCRPT_AREA_CODE_NM === regionFilter;
    return statusMatch && regionMatch;
  });

  // 이번달 달력용
  const year = today.getFullYear(), month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = `${year}년 ${month + 1}월`;

  // 날짜별 이벤트
  const byDay: Record<number, Item[]> = {};
  items.forEach(i => {
    const d = parseDate(i.GNRL_RNK1_CRSPAREA_RCPTDE as string);
    if (d && d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      (byDay[day] = byDay[day] || []).push(i);
    }
  });

  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 헤더 */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>청약 일정</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>총 {totalCount.toLocaleString()}건 · 분양정보 기준 청약 접수 일정</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "접수중", value: items.filter(i => getStatus(i) === "접수중").length, unit: "건", color: "#059669", bg: "#ECFDF5" },
          { label: "접수예정", value: items.filter(i => getStatus(i) === "접수예정").length, unit: "건", color: "#1D4ED8", bg: "#EFF6FF" },
          { label: "마감", value: items.filter(i => getStatus(i) === "마감").length, unit: "건", color: "#64748B", bg: "#F1F5F9" },
        ].map((k) => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 12, color: k.color, fontWeight: 700 }}>{k.label}</div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
              <span style={{ fontSize: 13, color: k.color, opacity: 0.7 }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 달력 */}
      <Card title={`청약 접수 달력 · ${monthLabel}`} sub="이번달 청약 접수 시작 단지">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 6 }}>
          {weekdays.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: i === 0 ? "#DC2626" : "var(--muted)", padding: "2px 0" }}>{w}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {cells.map((d, i) => {
            const evs = d ? (byDay[d] || []) : [];
            const has = evs.length > 0;
            return (
              <div key={i} className="cal-cell" style={{
                minHeight: 56, borderRadius: 8, padding: "4px 6px",
                background: has ? "#EFF6FF" : "var(--bg)",
                border: `1px solid ${has ? "#BFDBFE" : "transparent"}`,
              }}>
                {d && (
                  <>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: i % 7 === 0 ? "#DC2626" : "var(--ink)" }}>{d}</div>
                    {evs.slice(0, 1).map((e, j) => (
                      <div key={j} style={{ fontSize: 9.5, fontWeight: 600, color: "#1D4ED8", lineHeight: 1.3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(e.HOUSE_NM ?? "").slice(0, 8)}
                      </div>
                    ))}
                    {evs.length > 1 && <div style={{ fontSize: 9, color: "var(--muted)" }}>+{evs.length - 1}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 필터 + 목록 */}
      <Card title="청약 일정 목록" sub={`${filtered.length}건`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          {/* 상태 필터 */}
          <div style={{ display: "flex", gap: 4 }}>
            {["전체", "접수중", "접수예정", "마감"].map(f => (
              <button key={f} onClick={() => setStatusFilter(f)} style={{
                fontSize: 12, padding: "4px 10px", borderRadius: 16, cursor: "pointer",
                border: "1px solid " + (statusFilter === f ? "var(--ink)" : "var(--line)"),
                background: statusFilter === f ? "var(--ink)" : "var(--surface)",
                color: statusFilter === f ? "#fff" : "var(--ink)", fontFamily: "inherit", fontWeight: 600,
              }}>{f}</button>
            ))}
          </div>
          {/* 지역 필터 */}
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--line)",
            background: "var(--surface)", cursor: "pointer", fontFamily: "inherit", color: "var(--ink)",
          }}>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {isLoading
          ? <div style={{ height: 200, background: "var(--track)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          : (
            <div style={{ overflowX: "auto" }}>
              <table className="schedule-table" style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["단지명", "공급지역", "주택형", "공급세대", "1순위 접수일", "1순위 마감일", "당첨발표일", "상태"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 10px", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {String(item.HOUSE_NM ?? "-")}
                      </td>
                      <td style={{ padding: "10px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>{String(item.SUBSCRPT_AREA_CODE_NM ?? "-")}</td>
                      <td style={{ padding: "10px 10px", color: "var(--muted)" }}>{String(item.HOUSE_DTL_SECD_NM ?? "-")}</td>
                      <td style={{ padding: "10px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {item.TOT_SUPLY_HSHLDCO ? fmt(Number(item.TOT_SUPLY_HSHLDCO)) : "-"}
                      </td>
                      <td style={{ padding: "10px 10px", fontWeight: 600, color: "#1D4ED8", whiteSpace: "nowrap" }}>
                        {String(item.GNRL_RNK1_CRSPAREA_RCPTDE ?? "-")}
                      </td>
                      <td style={{ padding: "10px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {String(item.GNRL_RNK1_CRSPAREA_ENDDE ?? "-")}
                      </td>
                      <td style={{ padding: "10px 10px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {String(item.PRZWNER_PRESNATN_DE ?? "-")}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <StatusPill status={getStatus(item)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", opacity: page === 1 ? 0.4 : 1 }}>이전</button>
          <span style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>{page}페이지</span>
          <button onClick={() => setPage(p => p + 1)} disabled={items.length < 50}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", opacity: items.length < 50 ? 0.4 : 1 }}>다음</button>
        </div>
      </Card>
    </div>
  );
}

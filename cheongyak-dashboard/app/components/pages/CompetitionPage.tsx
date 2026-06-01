"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card, fmt } from "../ui";
import BarChart from "../charts/BarChart";
import LineChart from "../charts/LineChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function heatColor(rate: number): string {
  if (rate >= 200) return "#DC2626";
  if (rate >= 100) return "#EF4444";
  if (rate >= 50)  return "#F97316";
  if (rate >= 25)  return "#FB923C";
  if (rate >= 12)  return "#FCD34D";
  if (rate >= 6)   return "#93C5FD";
  return "#DBEAFE";
}

type Item = Record<string, string | number>;

export default function CompetitionPage() {
  const [page, setPage] = useState(1);
  const [rankFilter, setRankFilter] = useState<string>("전체");

  const { data: cmpData, isLoading } = useSWR(`/api/competition?page=${page}`, fetcher);

  const allItems: Item[] = cmpData?.competition?.items ?? [];
  const totalCount = cmpData?.competition?.totalCount ?? 0;

  const items = rankFilter === "전체" ? allItems
    : allItems.filter(i => String(i.SUBSCRPT_RANK_CODE) === (rankFilter === "1순위" ? "1" : "2"));

  // 주택형별 평균 경쟁률
  const typeMap: Record<string, { total: number; count: number }> = {};
  items.forEach(i => {
    const ty = String(i.HOUSE_TY ?? "기타");
    const rate = parseFloat(String(i.CMPET_RATE ?? "0")) || 0;
    if (!typeMap[ty]) typeMap[ty] = { total: 0, count: 0 };
    typeMap[ty].total += rate;
    typeMap[ty].count += 1;
  });
  const typeChart = Object.entries(typeMap)
    .map(([name, v]) => ({ name, value: v.count > 0 ? v.total / v.count : 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 거주지역별 평균 경쟁률
  const regionMap: Record<string, { total: number; count: number }> = {};
  items.forEach(i => {
    const r = String(i.RESIDE_SENM ?? "기타");
    const rate = parseFloat(String(i.CMPET_RATE ?? "0")) || 0;
    if (!regionMap[r]) regionMap[r] = { total: 0, count: 0 };
    regionMap[r].total += rate;
    regionMap[r].count += 1;
  });
  const regionChart = Object.entries(regionMap)
    .map(([name, v]) => ({ name, value: v.count > 0 ? v.total / v.count : 0 }))
    .sort((a, b) => b.value - a.value);

  // 상위 경쟁률 단지
  const topRanked = [...items]
    .filter(i => parseFloat(String(i.CMPET_RATE ?? "0")) > 0)
    .sort((a, b) => parseFloat(String(b.CMPET_RATE)) - parseFloat(String(a.CMPET_RATE)))
    .slice(0, 8)
    .map(i => ({
      name: String(i.PBLANC_NO ?? i.HOUSE_MANAGE_NO ?? ""),
      value: parseFloat(String(i.CMPET_RATE ?? "0")) || 0,
    }));

  const avgRate = items.length > 0
    ? (items.reduce((s, i) => s + (parseFloat(String(i.CMPET_RATE ?? "0")) || 0), 0) / items.length).toFixed(1)
    : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>경쟁률 분석</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>총 {totalCount.toLocaleString()}건 · APT 청약접수 경쟁률 데이터</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["전체", "1순위", "2순위"].map(f => (
            <button key={f} onClick={() => setRankFilter(f)} style={{
              fontSize: 12.5, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              border: "1px solid " + (rankFilter === f ? "var(--ink)" : "var(--line)"),
              background: rankFilter === f ? "var(--ink)" : "var(--surface)",
              color: rankFilter === f ? "#fff" : "var(--ink)", fontFamily: "inherit",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "평균 경쟁률", value: avgRate, unit: ":1", color: "#2563EB" },
          { label: "총 공급 세대", value: items.reduce((s, i) => s + Number(i.SUPLY_HSHLDCO ?? 0), 0).toLocaleString(), unit: "세대", color: "#0D9488" },
          { label: "총 접수 건수", value: items.reduce((s, i) => s + Number(i.REQ_CNT ?? 0), 0).toLocaleString(), unit: "건", color: "#F59E0B" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{k.label}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        <Card title="주택형별 평균 경쟁률 TOP 10" sub="주택형(면적) 기준 · 색상 = 과열 정도">
          {isLoading
            ? <div style={{ height: 280, background: "var(--track)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
            : <BarChart data={typeChart} unit=":1" height={280} colorScale />}
        </Card>
        <Card title="거주지역별 평균 경쟁률" sub="해당지역 / 기타지역 / 기타경기">
          {regionChart.length > 0
            ? <BarChart data={regionChart} unit=":1" height={160} colorScale />
            : <div style={{ height: 160, background: "var(--track)", borderRadius: 8 }} />}
        </Card>
      </div>

      {/* 상위 경쟁률 단지 */}
      <Card title="경쟁률 상위 단지 TOP 8" sub="공고번호 기준">
        {topRanked.length > 0
          ? <BarChart data={topRanked} unit=":1" height={220} colorScale />
          : <div style={{ height: 200, background: "var(--track)", borderRadius: 8 }} />}
      </Card>

      {/* 상세 테이블 */}
      <Card title="경쟁률 상세 목록" sub={`총 ${totalCount.toLocaleString()}건`}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                {["주택관리번호", "주택형", "순위", "거주구분", "공급세대", "접수건수", "경쟁률"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "var(--muted)", fontSize: 11, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 15).map((item, i) => {
                const rate = parseFloat(String(item.CMPET_RATE ?? "0")) || 0;
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px", fontWeight: 600, color: "#1D4ED8" }}>{String(item.HOUSE_MANAGE_NO ?? "-")}</td>
                    <td style={{ padding: "10px" }}>{String(item.HOUSE_TY ?? "-")}</td>
                    <td style={{ padding: "10px" }}>{String(item.SUBSCRPT_RANK_CODE ?? "-")}순위</td>
                    <td style={{ padding: "10px", color: "var(--muted)" }}>{String(item.RESIDE_SENM ?? "-")}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(item.SUPLY_HSHLDCO ?? 0))}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(Number(item.REQ_CNT ?? 0))}</td>
                    <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: heatColor(rate), fontVariantNumeric: "tabular-nums" }}>
                      {rate > 0 ? `${rate.toFixed(1)}:1` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", opacity: page === 1 ? 0.4 : 1 }}>이전</button>
          <span style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)" }}>{page}페이지</span>
          <button onClick={() => setPage(p => p + 1)} disabled={items.length < 20}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", cursor: "pointer", fontSize: 12, fontFamily: "inherit", opacity: items.length < 20 ? 0.4 : 1 }}>다음</button>
        </div>
      </Card>
    </div>
  );
}

"use client";

import useSWR from "swr";
import { Card, heatColor } from "../ui";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

const REGION_ORDER = ["서울", "경기", "인천", "강원", "충북", "세종", "충남", "대전", "경북", "전북", "대구", "울산", "광주", "전남", "경남", "부산", "제주"];

export default function RegionPage() {
  const { data: statData, isLoading } = useSWR("/api/applicants", fetcher);

  const reqstItems: Item[] = statData?.reqst?.items ?? [];
  const przItems: Item[] = statData?.przwner?.items ?? [];

  // 지역별 최신 데이터 집계 (최신 STAT_DE 기준)
  const latestDate = [...reqstItems].sort((a, b) => String(b.STAT_DE).localeCompare(String(a.STAT_DE)))[0]?.STAT_DE ?? "";
  const latestReqst = reqstItems.filter(i => i.STAT_DE === latestDate);
  const latestPrzwner = przItems.filter(i => i.STAT_DE === latestDate);

  // 지역 코드 → 이름 매핑
  const reqstByCode: Record<string, Item> = {};
  latestReqst.forEach(i => { reqstByCode[String(i.SUBSCRPT_AREA_CODE_NM ?? "")] = i; });

  const przByCode: Record<string, Item> = {};
  latestPrzwner.forEach(i => { przByCode[String(i.SUBSCRPT_AREA_CODE_NM ?? "")] = i; });

  // 모든 지역 합산
  const allRegions = Array.from(new Set([...latestReqst, ...latestPrzwner].map(i => String(i.SUBSCRPT_AREA_CODE_NM ?? ""))));
  const regions = REGION_ORDER.filter(r => allRegions.includes(r)).concat(allRegions.filter(r => !REGION_ORDER.includes(r)));

  // 전체 합계
  const totalReqst = latestReqst.reduce((s, i) => s + Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0), 0);
  const totalPrz = latestPrzwner.reduce((s, i) => s + Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0), 0);

  const statMonth = String(latestDate).length === 6
    ? `${String(latestDate).slice(0, 4)}년 ${String(latestDate).slice(4)}월`
    : String(latestDate);

  // 월별 추이 (전체 합산)
  const monthMap: Record<string, { reqst: number; przwner: number }> = {};
  reqstItems.forEach(i => {
    const m = String(i.STAT_DE ?? "");
    if (!monthMap[m]) monthMap[m] = { reqst: 0, przwner: 0 };
    monthMap[m].reqst += Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
  });
  przItems.forEach(i => {
    const m = String(i.STAT_DE ?? "");
    if (!monthMap[m]) monthMap[m] = { reqst: 0, przwner: 0 };
    monthMap[m].przwner += Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
  });
  const trend = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12);

  // 최대값 (바 차트 스케일)
  const maxReqst = Math.max(...regions.map(r => {
    const d = reqstByCode[r];
    return d ? Number(d.AGE_30 ?? 0) + Number(d.AGE_40 ?? 0) + Number(d.AGE_50 ?? 0) + Number(d.AGE_60 ?? 0) : 0;
  }), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 헤더 */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>지역 현황</h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>기준월: {statMonth} · 지역별 청약 신청자·당첨자 통계</p>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "총 신청건수", value: totalReqst.toLocaleString(), unit: "건", color: "#2563EB" },
          { label: "총 당첨건수", value: totalPrz.toLocaleString(), unit: "건", color: "#0D9488" },
          { label: "당첨률", value: totalReqst > 0 ? ((totalPrz / totalReqst) * 100).toFixed(2) : "-", unit: "%", color: "#F59E0B" },
        ].map((k) => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{k.label}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 지역별 신청·당첨 현황 */}
      <Card title="지역별 신청·당첨 현황" sub="연령대별 신청건수 · 막대 길이 = 총 신청 규모">
        {isLoading
          ? <div style={{ height: 400, background: "var(--track)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* 범례 */}
              <div style={{ display: "flex", gap: 16, fontSize: 11.5, marginBottom: 4 }}>
                {[["#3B82F6", "30대 이하"], ["#10B981", "40대"], ["#F59E0B", "50대"], ["#EF4444", "60대 이상"]].map(([c, l]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--muted)", fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />{l}
                  </span>
                ))}
              </div>
              {regions.map((region) => {
                const d = reqstByCode[region];
                const pd = przByCode[region];
                if (!d) return null;
                const a30 = Number(d.AGE_30 ?? 0), a40 = Number(d.AGE_40 ?? 0), a50 = Number(d.AGE_50 ?? 0), a60 = Number(d.AGE_60 ?? 0);
                const total = a30 + a40 + a50 + a60;
                const pTotal = pd ? Number(pd.AGE_30 ?? 0) + Number(pd.AGE_40 ?? 0) + Number(pd.AGE_50 ?? 0) + Number(pd.AGE_60 ?? 0) : 0;
                const w = (total / maxReqst) * 100;
                const segs = [
                  { v: a30, c: "#3B82F6" }, { v: a40, c: "#10B981" },
                  { v: a50, c: "#F59E0B" }, { v: a60, c: "#EF4444" },
                ];
                return (
                  <div key={region} style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{region}</div>
                    <div style={{ background: "var(--track)", borderRadius: 5, height: 22, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, width: w + "%", display: "flex", borderRadius: 5, overflow: "hidden" }}>
                        {segs.map((seg, i) => (
                          <div key={i} style={{ height: "100%", width: total > 0 ? (seg.v / total * 100) + "%" : "0%", background: seg.c }} />
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                      신청 {total.toLocaleString()} / 당첨 <span style={{ color: "#059669", fontWeight: 700 }}>{pTotal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </Card>

      {/* 월별 추이 */}
      <Card title="전국 월별 신청·당첨 추이" sub="전국 합산 기준">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["기준월", "총 신청건수", "총 당첨건수", "당첨률"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: h === "기준월" ? "left" : "right", fontWeight: 700, color: "var(--muted)", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trend.map(([month, v], i) => {
                const label = month.length === 6 ? `${month.slice(0, 4)}년 ${month.slice(4)}월` : month;
                const rate = v.reqst > 0 ? ((v.przwner / v.reqst) * 100).toFixed(2) : "-";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{label}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#2563EB", fontWeight: 600 }}>{v.reqst.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "#059669", fontWeight: 600 }}>{v.przwner.toLocaleString()}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>{rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

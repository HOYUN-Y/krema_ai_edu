"use client";

import useSWR from "swr";
import { useState } from "react";
import { Card } from "../ui";
import KoreaMap from "../charts/KoreaMap";
import BarChart from "../charts/BarChart";
import LineChart from "../charts/LineChart";
import StackedBarChart from "../charts/StackedBarChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

const REGION_TILES: { code: string; name: string; tile: [number, number] }[] = [
  { code: "강원", name: "강원", tile: [4, 0] },
  { code: "인천", name: "인천", tile: [1, 1] },
  { code: "서울", name: "서울", tile: [2, 1] },
  { code: "경기", name: "경기", tile: [3, 1] },
  { code: "충남", name: "충남", tile: [1, 2] },
  { code: "세종", name: "세종", tile: [2, 2] },
  { code: "충북", name: "충북", tile: [3, 2] },
  { code: "경북", name: "경북", tile: [4, 2] },
  { code: "대전", name: "대전", tile: [2, 3] },
  { code: "전북", name: "전북", tile: [1, 3] },
  { code: "대구", name: "대구", tile: [3, 3] },
  { code: "울산", name: "울산", tile: [4, 3] },
  { code: "광주", name: "광주", tile: [1, 4] },
  { code: "전남", name: "전남", tile: [2, 4] },
  { code: "경남", name: "경남", tile: [3, 4] },
  { code: "부산", name: "부산", tile: [4, 4] },
  { code: "제주", name: "제주", tile: [1, 5] },
];

const NAME_TO_CODE: Record<string, string> = {
  "서울": "서울", "경기": "경기", "인천": "인천", "강원": "강원",
  "충북": "충북", "세종": "세종", "충남": "충남", "대전": "대전",
  "경북": "경북", "전북": "전북", "대구": "대구", "울산": "울산",
  "광주": "광주", "전남": "전남", "경남": "경남", "부산": "부산", "제주": "제주",
};

type RegionStat = {
  code: string; name: string;
  totalReqst: number; totalPrz: number;
  age30: number; age40: number; age50: number; age60: number;
};

export default function RegionPage() {
  const { data: statData, isLoading } = useSWR("/api/applicants", fetcher);
  const [metric, setMetric] = useState<"reqst" | "przwner">("reqst");
  const [selected, setSelected] = useState<string>("서울");

  const reqstItems: Item[] = statData?.reqst?.items ?? [];
  const przItems: Item[]   = statData?.przwner?.items ?? [];

  const latestDate = [...reqstItems]
    .sort((a, b) => String(b.STAT_DE).localeCompare(String(a.STAT_DE)))[0]?.STAT_DE ?? "";

  const regionStats: Record<string, RegionStat> = {};
  REGION_TILES.forEach(r => {
    regionStats[r.code] = { code: r.code, name: r.name, totalReqst: 0, totalPrz: 0, age30: 0, age40: 0, age50: 0, age60: 0 };
  });
  reqstItems.filter(i => i.STAT_DE === latestDate).forEach(i => {
    const code = NAME_TO_CODE[String(i.SUBSCRPT_AREA_CODE_NM ?? "")];
    if (code && regionStats[code]) {
      regionStats[code].age30 += Number(i.AGE_30 ?? 0);
      regionStats[code].age40 += Number(i.AGE_40 ?? 0);
      regionStats[code].age50 += Number(i.AGE_50 ?? 0);
      regionStats[code].age60 += Number(i.AGE_60 ?? 0);
      regionStats[code].totalReqst += Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
    }
  });
  przItems.filter(i => i.STAT_DE === latestDate).forEach(i => {
    const code = NAME_TO_CODE[String(i.SUBSCRPT_AREA_CODE_NM ?? "")];
    if (code && regionStats[code]) {
      regionStats[code].totalPrz += Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
    }
  });

  // 월별 추이
  const monthMap: Record<string, number> = {};
  reqstItems.forEach(i => {
    const m = String(i.STAT_DE ?? "");
    if (!m) return;
    const label = m.slice(4) + "월";
    monthMap[label] = (monthMap[label] ?? 0) +
      Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
  });
  const trend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, value]) => ({ month, value }));

  // KoreaMap 데이터
  const mapData = Object.values(regionStats).map(r => ({
    name: r.name,
    value: metric === "reqst" ? r.totalReqst : r.totalPrz,
  }));

  // 지역 랭킹 (바 차트용)
  const rankingData = Object.values(regionStats)
    .sort((a, b) => b.totalReqst - a.totalReqst)
    .slice(0, 8)
    .map(r => ({ name: r.name, value: r.totalReqst }));

  // 선택 지역
  const sel = regionStats[selected] ?? regionStats["서울"];

  // 연령대 스택 바 차트
  const ageCategories = ["30대 이하", "40대", "50대", "60대 이상"];
  const ageData = [sel.age30, sel.age40, sel.age50, sel.age60];

  const statMonth = String(latestDate).length === 6
    ? `${String(latestDate).slice(0, 4)}년 ${String(latestDate).slice(4)}월`
    : String(latestDate);

  const totalReqst = Object.values(regionStats).reduce((s, r) => s + r.totalReqst, 0);
  const totalPrz   = Object.values(regionStats).reduce((s, r) => s + r.totalPrz, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>지역 현황</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>
            기준월: {statMonth} · 지역을 클릭하면 상세 현황이 표시됩니다
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>지표</span>
          {(["reqst", "przwner"] as const).map((m) => (
            <button key={m} onClick={() => setMetric(m)} style={{
              fontSize: 12.5, fontWeight: 600, padding: "6px 14px", borderRadius: 20, cursor: "pointer",
              border: "1px solid " + (metric === m ? "var(--ink)" : "var(--line)"),
              background: metric === m ? "var(--ink)" : "var(--surface)",
              color: metric === m ? "#fff" : "var(--ink)", fontFamily: "inherit",
            }}>{m === "reqst" ? "신청건수" : "당첨건수"}</button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          { label: "총 신청건수", value: totalReqst.toLocaleString(), unit: "건", color: "#2563EB" },
          { label: "총 당첨건수", value: totalPrz.toLocaleString(), unit: "건", color: "#059669" },
          { label: "당첨률", value: totalReqst > 0 ? ((totalPrz / totalReqst) * 100).toFixed(2) : "-", unit: "%", color: "#F59E0B" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{k.label}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: k.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 메인 2컬럼: 코로플레스 지도 + 우측 패널 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 18 }}>
        {/* 좌: 한국 코로플레스 지도 */}
        <Card title="전국 청약 히트맵" sub={`${metric === "reqst" ? "신청건수" : "당첨건수"} 기준 · 지역 클릭 시 상세 표시`}>
          {isLoading
            ? <div style={{ height: 400, background: "var(--track)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
            : <KoreaMap data={mapData} onSelect={setSelected} selected={selected} height={400} />}
        </Card>

        {/* 우: 선택 지역 상세 */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 선택 지역 KPI */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, boxShadow: "var(--shadow)" }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>
              📍 {sel.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "신청건수", value: sel.totalReqst.toLocaleString(), color: "#2563EB" },
                { label: "당첨건수", value: sel.totalPrz.toLocaleString(), color: "#059669" },
                { label: "당첨률", value: sel.totalReqst > 0 ? ((sel.totalPrz / sel.totalReqst) * 100).toFixed(1) + "%" : "-", color: "#F59E0B" },
              ].map(k => (
                <div key={k.label} style={{ background: "var(--bg)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* 연령대 스택 바 */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 6 }}>연령대별 신청 분포</div>
              <StackedBarChart
                categories={ageCategories}
                series={[{
                  name: "신청건수",
                  data: ageData,
                  color: "#3B82F6",
                }]}
                height={130}
                horizontal={false}
              />
            </div>
          </div>

          {/* 지역 랭킹 */}
          <Card title="지역별 신청건수 TOP 8" sub="클릭하면 지도에서 선택">
            <BarChart
              data={rankingData}
              unit="건"
              height={220}
            />
          </Card>
        </aside>
      </div>

      {/* 월별 추이 */}
      <Card title="전국 월별 신청 추이" sub="전국 합산 신청건수">
        <LineChart data={trend} color="#2563EB" unit="건" height={180} />
      </Card>

      {/* 월별 테이블 */}
      <Card title="전국 월별 신청·당첨 현황" sub="기준월별 합산">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 12.5, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["기준월", "총 신청건수", "총 당첨건수", "당첨률"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: h === "기준월" ? "left" : "right", fontWeight: 700, color: "var(--muted)", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(monthMap)
                .sort(([a], [b]) => a.localeCompare(b))
                .slice(-12)
                .map(([month, reqst], i) => {
                  const przMonth = (() => {
                    const raw = Object.entries(
                      przItems.reduce((acc: Record<string, number>, item) => {
                        const m = String(item.STAT_DE ?? "");
                        const label = m.slice(4) + "월";
                        acc[label] = (acc[label] ?? 0) + Number(item.AGE_30 ?? 0) + Number(item.AGE_40 ?? 0) + Number(item.AGE_50 ?? 0) + Number(item.AGE_60 ?? 0);
                        return acc;
                      }, {})
                    ).find(([k]) => k === month);
                    return raw ? raw[1] : 0;
                  })();
                  const rate = reqst > 0 ? ((przMonth / reqst) * 100).toFixed(2) : "-";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{month}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#2563EB", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{reqst.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#059669", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{przMonth.toLocaleString()}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{rate}%</td>
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

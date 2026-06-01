"use client";

import useSWR from "swr";
import { useState } from "react";
import { heatColor, fmt } from "../ui";
import { AreaLine } from "../charts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 지역 타일 좌표 (행정구역 근사 배치)
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

// 공급지역명 → 타일 코드 매핑
const NAME_TO_CODE: Record<string, string> = {
  "서울": "서울", "경기": "경기", "인천": "인천", "강원": "강원",
  "충북": "충북", "세종": "세종", "충남": "충남", "대전": "대전",
  "경북": "경북", "전북": "전북", "대구": "대구", "울산": "울산",
  "광주": "광주", "전남": "전남", "경남": "경남", "부산": "부산", "제주": "제주",
};

type Item = Record<string, string | number>;
type RegionStat = {
  code: string; name: string;
  totalReqst: number; totalPrz: number;
  age30: number; age40: number; age50: number; age60: number;
};

const HEAT_LEGEND = [
  ["#DBEAFE", "~100"], ["#93C5FD", "~500"], ["#FCD34D", "~1K"],
  ["#FB923C", "~5K"], ["#F97316", "~20K"], ["#DC2626", "20K+"],
];

function reqstHeatColor(val: number): string {
  if (val >= 20000) return "#DC2626";
  if (val >= 5000)  return "#F97316";
  if (val >= 1000)  return "#FB923C";
  if (val >= 500)   return "#FCD34D";
  if (val >= 100)   return "#93C5FD";
  return "#DBEAFE";
}

export default function RegionPage() {
  const { data: statData, isLoading } = useSWR("/api/applicants", fetcher);
  const [metric, setMetric] = useState<"reqst" | "przwner">("reqst");
  const [selected, setSelected] = useState<string>("서울");

  const reqstItems: Item[] = statData?.reqst?.items ?? [];
  const przItems: Item[] = statData?.przwner?.items ?? [];

  // 지역별 최신 데이터 집계
  const latestDate = [...reqstItems]
    .sort((a, b) => String(b.STAT_DE).localeCompare(String(a.STAT_DE)))[0]?.STAT_DE ?? "";

  const regionStats: Record<string, RegionStat> = {};
  REGION_TILES.forEach(r => {
    regionStats[r.code] = { code: r.code, name: r.name, totalReqst: 0, totalPrz: 0, age30: 0, age40: 0, age50: 0, age60: 0 };
  });

  reqstItems.filter(i => i.STAT_DE === latestDate).forEach(i => {
    const nm = String(i.SUBSCRPT_AREA_CODE_NM ?? "");
    const code = NAME_TO_CODE[nm];
    if (code && regionStats[code]) {
      regionStats[code].age30 += Number(i.AGE_30 ?? 0);
      regionStats[code].age40 += Number(i.AGE_40 ?? 0);
      regionStats[code].age50 += Number(i.AGE_50 ?? 0);
      regionStats[code].age60 += Number(i.AGE_60 ?? 0);
      regionStats[code].totalReqst += Number(i.AGE_30 ?? 0) + Number(i.AGE_40 ?? 0) + Number(i.AGE_50 ?? 0) + Number(i.AGE_60 ?? 0);
    }
  });
  przItems.filter(i => i.STAT_DE === latestDate).forEach(i => {
    const nm = String(i.SUBSCRPT_AREA_CODE_NM ?? "");
    const code = NAME_TO_CODE[nm];
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
    .map(([month, rate]) => ({ month, rate }));

  // 지역 랭킹
  const ranking = Object.values(regionStats)
    .sort((a, b) => b.totalReqst - a.totalReqst)
    .slice(0, 8);

  const sel = regionStats[selected] ?? regionStats["서울"];
  const statMonth = String(latestDate).length === 6
    ? `${String(latestDate).slice(0, 4)}년 ${String(latestDate).slice(4)}월`
    : String(latestDate);

  // 타일맵 렌더
  const cell = 52, gap = 6;
  const cols = Math.max(...REGION_TILES.map(r => r.tile[0])) + 1;
  const rows = Math.max(...REGION_TILES.map(r => r.tile[1])) + 1;
  const mapW = cols * (cell + gap);
  const mapH = rows * (cell + gap);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* 서브 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>지역 현황</h2>
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>기준월: {statMonth} · 지역 타일을 클릭하면 상세 현황이 표시됩니다</p>
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

      {/* 메인 2컬럼 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 18 }}>
        {/* 좌: 타일맵 + 추이 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 타일맵 카드 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow)", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>전국 청약 히트맵</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  {metric === "reqst" ? "청약 신청건수" : "당첨건수"} 기준 · 색상 = 규모
                </div>
              </div>
              {/* 범례 */}
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {HEAT_LEGEND.map(([c, l], i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 28, height: 9, background: c, display: "block",
                      borderRadius: i === 0 ? "3px 0 0 3px" : i === HEAT_LEGEND.length - 1 ? "0 3px 3px 0" : 0 }} />
                    <span style={{ fontSize: 9, color: "var(--muted)" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>

            {isLoading
              ? <div style={{ height: mapH + 40, background: "var(--track)", borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
              : (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div style={{ position: "relative", width: mapW, height: mapH }}>
                    {REGION_TILES.map((r) => {
                      const stat = regionStats[r.code];
                      const val = metric === "reqst" ? stat.totalReqst : stat.totalPrz;
                      const isSelected = selected === r.code;
                      const color = reqstHeatColor(val);
                      const isHot = val >= 1000;
                      return (
                        <div key={r.code}
                          onClick={() => setSelected(r.code)}
                          style={{
                            position: "absolute",
                            left: r.tile[0] * (cell + gap),
                            top: r.tile[1] * (cell + gap),
                            width: cell, height: cell,
                            borderRadius: 10,
                            background: color,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            transform: isSelected ? "scale(1.1)" : "scale(1)",
                            transition: "transform .15s, box-shadow .15s",
                            boxShadow: isSelected ? "0 6px 20px rgba(15,23,42,.25)" : "none",
                            outline: isSelected ? "2.5px solid var(--ink)" : "none",
                            zIndex: isSelected ? 5 : 1,
                          }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isHot ? "#fff" : "var(--ink)" }}>{r.name}</div>
                          <div style={{ fontSize: 9.5, fontWeight: 600, color: isHot ? "rgba(255,255,255,.85)" : "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                            {val > 0 ? val.toLocaleString() : "-"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>

          {/* 월별 추이 */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow)", padding: 18 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 2 }}>전국 월별 신청 추이</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 12 }}>전국 합산 신청건수</div>
            {trend.length > 0
              ? <AreaLine data={trend} valueKey="rate" color="#2563EB" />
              : <div style={{ height: 140, background: "var(--track)", borderRadius: 8 }} />}
          </div>
        </div>

        {/* 우: 지역 상세 패널 */}
        <aside style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow)", padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* 선택 지역 헤더 */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: reqstHeatColor(sel.totalReqst), display: "inline-block" }} />
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{sel.name}</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>총 신청건수</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                  {sel.totalReqst.toLocaleString()}
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>건</span>
                </div>
              </div>
              <div style={{ background: "var(--bg)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>총 당첨건수</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                  {sel.totalPrz.toLocaleString()}
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>건</span>
                </div>
              </div>
            </div>
            {/* 당첨률 */}
            <div style={{ marginTop: 10, padding: "10px 14px", background: "var(--bg)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>당첨률</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B", fontVariantNumeric: "tabular-nums" }}>
                {sel.totalReqst > 0 ? ((sel.totalPrz / sel.totalReqst) * 100).toFixed(2) : "-"}%
              </span>
            </div>
          </div>

          {/* 연령대 분포 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>연령대별 신청 분포</div>
            {[
              { label: "30대 이하", value: sel.age30, color: "#3B82F6" },
              { label: "40대", value: sel.age40, color: "#10B981" },
              { label: "50대", value: sel.age50, color: "#F59E0B" },
              { label: "60대 이상", value: sel.age60, color: "#EF4444" },
            ].map((a) => {
              const total = sel.age30 + sel.age40 + sel.age50 + sel.age60 || 1;
              const pct = (a.value / total * 100).toFixed(1);
              return (
                <div key={a.label} style={{ display: "grid", gridTemplateColumns: "70px 1fr 50px", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{a.label}</span>
                  <div style={{ background: "var(--track)", borderRadius: 4, height: 18, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: a.color, borderRadius: 4, transition: "width .5s" }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* 지역 랭킹 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>지역별 신청건수 랭킹</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ranking.map((r, i) => {
                const maxVal = ranking[0].totalReqst || 1;
                const w = (r.totalReqst / maxVal * 100);
                const isSelected = r.code === selected;
                return (
                  <div key={r.code} onClick={() => setSelected(r.code)} style={{
                    display: "grid", gridTemplateColumns: "20px 60px 1fr 70px",
                    alignItems: "center", gap: 8, cursor: "pointer",
                    padding: "4px 6px", borderRadius: 7,
                    background: isSelected ? "#EFF6FF" : "transparent",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? "#1D4ED8" : "var(--muted)", textAlign: "center" }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{r.name}</span>
                    <div style={{ background: "var(--track)", borderRadius: 4, height: 16, overflow: "hidden" }}>
                      <div style={{ width: w + "%", height: "100%", background: reqstHeatColor(r.totalReqst), borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>
                      {r.totalReqst.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

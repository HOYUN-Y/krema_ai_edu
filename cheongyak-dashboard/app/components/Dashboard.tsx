"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { parseAsString, parseAsStringEnum, useQueryState } from "nuqs";
import { Card, KpiCard, Logo, Chip, StatusPill, fmt } from "./ui";
import DonutChart from "./charts/DonutChart";
import BarChart from "./charts/BarChart";
import LineChart from "./charts/LineChart";
import CompetitionPage from "./pages/CompetitionPage";
import RegionPage from "./pages/RegionPage";
import SchedulePage from "./pages/SchedulePage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type NavKey = "대시보드" | "경쟁률 분석" | "분양가·시세" | "지역 현황" | "청약 일정";

const NAV: [string, NavKey, boolean][] = [
  ["◧", "대시보드", true],
  ["▦", "경쟁률 분석", false],
  ["⇅", "분양가·시세", false],
  ["◉", "지역 현황", false],
  ["▤", "청약 일정", false],
];

const SUPPLY_TYPES = [
  { label: "민영주택", value: 58, color: "#2563EB" },
  { label: "국민주택", value: 22, color: "#0D9488" },
  { label: "신혼희망", value: 11, color: "#F59E0B" },
  { label: "공공분양", value: 9,  color: "#7C3AED" },
];

type Item = Record<string, string | number>;

export default function Dashboard() {
  // nuqs: URL ↔ 상태 동기화 (뒤로가기·공유·북마크 지원)
  const [activePage, setActivePage] = useQueryState(
    "page",
    parseAsStringEnum<NavKey>(["대시보드", "경쟁률 분석", "분양가·시세", "지역 현황", "청약 일정"])
      .withDefault("대시보드")
  );
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringEnum(["전체", "수도권", "민영"]).withDefault("전체")
  );

  const { data: annData, isLoading: annLoading } = useSWR(
    `/api/announcements?page=1&filter=${encodeURIComponent(filter)}`, fetcher
  );
  const { data: cmpData } = useSWR(
    `/api/competition?filter=${encodeURIComponent(filter)}`, fetcher
  );
  const { data: statData } = useSWR("/api/applicants", fetcher);

  const announcements: Item[] = annData?.items ?? [];
  const totalCount: number = annData?.totalCount ?? 0;
  // ★ matchCount: 실제 필터 적용 결과 수 (totalCount는 필터 무관한 전체 크기라 사용 X)
  const matchCount: number = annData?.matchCount ?? totalCount;
  const filteredCount: number = annData?.filteredCount ?? matchCount;
  const compItems: Item[] = cmpData?.competition?.items ?? [];
  const statItems: Item[] = statData?.reqst?.items ?? [];

  // 경쟁률 TOP 8: HOUSE_MANAGE_NO별 최고 경쟁률
  const cmpByKey: Record<string, { name: string; rate: number; area: string }> = {};
  compItems.forEach((item) => {
    const key = String(item.HOUSE_MANAGE_NO ?? "");
    const rate = parseFloat(String(item.CMPET_RATE ?? "0")) || 0;
    if (!cmpByKey[key] || rate > cmpByKey[key].rate) {
      cmpByKey[key] = {
        name: String(item.HOUSE_MANAGE_NO ?? key),
        rate,
        area: String(item.RESIDE_SENM ?? ""),
      };
    }
  });
  const ranked = Object.values(cmpByKey).sort((a, b) => b.rate - a.rate).slice(0, 8);

  // 월별 신청 추이
  const monthMap: Record<string, number> = {};
  statItems.forEach((item) => {
    const m = String(item.STAT_DE ?? "");
    if (!m) return;
    const label = m.slice(4) + "월";
    monthMap[label] = (monthMap[label] ?? 0) +
      Number(item.AGE_30 ?? 0) + Number(item.AGE_40 ?? 0) +
      Number(item.AGE_50 ?? 0) + Number(item.AGE_60 ?? 0);
  });
  const trend = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([month, rate]) => ({ month, rate }));

  // KPI
  const totalSupply = announcements.reduce((s, i) => s + (Number(i.TOT_SUPLY_HSHLDCO) || 0), 0);
  const validRates = compItems.map(i => parseFloat(String(i.CMPET_RATE ?? ""))).filter(v => !isNaN(v) && v > 0);
  const avgRate = validRates.length > 0 ? (validRates.reduce((a, b) => a + b, 0) / validRates.length).toFixed(1) : "-";

  const kpis = [
    { label: "분양 공고 건수", value: matchCount ? matchCount.toLocaleString() : "…", unit: "건", delta: 12.4, sub: filter === "전체" ? "전체 누적" : filter + " 필터", spark: [60, 70, 80, 90, 100, 110, 120] },
    { label: "평균 경쟁률", value: avgRate, unit: ":1", delta: 14.2, sub: "조회 기준", sparkColor: "#F97316", spark: trend.slice(-7).map(t => t.rate || 1) },
    { label: "총 공급 세대", value: totalSupply ? totalSupply.toLocaleString() : "…", unit: "세대", delta: 6.8, sub: "조회 기준", sparkColor: "#0D9488", spark: [2000, 3000, 2500, 4000, 3800, 5000, totalSupply / 100 || 1] },
    { label: "연동 API", value: "3", unit: "개", delta: 0, sub: "실시간 연동", sparkColor: "#7C3AED", spark: [1, 1, 2, 2, 3, 3, 3] },
  ];

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sans)", color: "var(--ink)" }}>
      {/* Sidebar */}
      <aside style={{ width: 224, background: "var(--surface)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "20px 18px", borderBottom: "1px solid var(--line)" }}>
          <Logo />
        </div>
        <nav style={{ padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(([ic, label], i) => {
            const isActive = activePage === label;
            const disabled = label === "분양가·시세";
            return (
              <div key={i} onClick={() => !disabled && setActivePage(label as NavKey)} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 9,
                cursor: disabled ? "not-allowed" : "pointer",
                background: isActive ? "#EFF6FF" : "transparent",
                color: disabled ? "#CBD5E1" : isActive ? "#1D4ED8" : "var(--muted)",
                fontWeight: isActive ? 700 : 600, fontSize: 13.5,
                userSelect: "none",
              }}>
                <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{ic}</span>
                <span>{label}</span>
                {disabled && <span style={{ fontSize: 9, marginLeft: "auto", background: "#F1F5F9", color: "#94A3B8", padding: "1px 5px", borderRadius: 4 }}>준비중</span>}
              </div>
            );
          })}
        </nav>
        <div style={{ marginTop: "auto", padding: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E293B", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>청</div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>청약 인사이트</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>공공데이터 연동</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 64, background: "var(--surface)", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>전국 청약 현황 대시보드</div>
            <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
              {new Date().getFullYear()}년 {new Date().getMonth() + 1}월 · 한국부동산원 청약홈 API
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(["전체", "수도권", "민영"] as const).map((label) => (
              <Chip key={label} label={label} active={filter === label} onClick={() => setFilter(label)} />
            ))}
            {annLoading && (
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>로딩 중…</span>
            )}
            {!annLoading && matchCount > 0 && (
              <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>
                {filter === "전체"
                  ? `전체 ${matchCount.toLocaleString()}건`
                  : `${filteredCount}건 / 전체 ${matchCount.toLocaleString()}건`}
              </span>
            )}
          </div>
        </header>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          {activePage === "경쟁률 분석" && <CompetitionPage />}
          {activePage === "지역 현황" && <RegionPage />}
          {activePage === "청약 일정" && <SchedulePage />}
          {activePage === "대시보드" && (
            <>
              {/* KPI strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
                {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
              </div>

              {/* Row 2: 경쟁률 랭킹 + 추이 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 18 }}>
                <Card title="경쟁률 TOP 8" sub="공고번호별 1순위 최고 경쟁률 · 색상 = 과열 정도">
                  <Suspense fallback={<div style={{ height: 240, background: "var(--track)", borderRadius: 8 }} />}>
                    <BarChart
                      data={ranked.map(r => ({ name: r.name, value: r.rate }))}
                      unit=":1"
                      height={240}
                      colorScale
                    />
                  </Suspense>
                </Card>
                <Card title="월별 신청 추이" sub="지역별 연령대 신청건수 합계">
                  <Suspense fallback={<div style={{ height: 200, background: "var(--track)", borderRadius: 8 }} />}>
                    <LineChart
                      data={trend.map(t => ({ month: t.month, value: t.rate }))}
                      color="#2563EB"
                      height={200}
                      unit="건"
                    />
                  </Suspense>
                </Card>
              </div>

              {/* Row 3: 분양 공고 테이블 + 공급유형 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
                <Card title="청약 일정" sub="분양 공고 목록 (최신순)">
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1.4fr 1fr 0.8fr 0.8fr 90px", gap: 0, fontSize: 12.5 }}>
                    <div style={{ display: "contents" }}>
                      {["접수시작일", "단지명", "공급지역", "주택형", "공급세대", "상태"].map((h, i) => (
                        <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", padding: "0 8px 10px", borderBottom: "1px solid var(--line)" }}>{h}</div>
                      ))}
                    </div>
                    {announcements.length === 0
                      ? <div style={{ gridColumn: "1/-1", padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>데이터 로딩 중…</div>
                      : announcements.slice(0, 8).map((c, i) => {
                        const startDate = String(c.GNRL_RNK1_CRSPAREA_RCPTDE ?? "-");
                        const isOpen = startDate !== "-" && new Date(startDate) <= new Date();
                        const status = isOpen ? "접수중" : "접수예정";
                        return (
                          <div key={i} style={{ display: "contents" }}>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)", fontWeight: 700, color: "#1D4ED8", fontVariantNumeric: "tabular-nums" }}>
                              {startDate !== "-" ? startDate.slice(5).replace("-", ".") : "-"}
                            </div>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {String(c.HOUSE_NM ?? "-")}
                            </div>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
                              {String(c.SUBSCRPT_AREA_CODE_NM ?? "-")}
                            </div>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
                              {String(c.HOUSE_DTL_SECD_NM ?? "-")}
                            </div>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)", fontVariantNumeric: "tabular-nums" }}>
                              {c.TOT_SUPLY_HSHLDCO ? fmt(Number(c.TOT_SUPLY_HSHLDCO)) : "-"}
                            </div>
                            <div style={{ padding: "12px 8px", borderBottom: "1px solid var(--line)" }}>
                              <StatusPill status={status} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </Card>

                <Card title="공급 유형 구성" sub="주택구분 기준 (참고용)">
                  <Suspense fallback={<div style={{ height: 200, background: "var(--track)", borderRadius: 8 }} />}>
                    <DonutChart
                      data={SUPPLY_TYPES.map(s => ({ label: s.label, value: s.value, color: s.color }))}
                      centerValue={matchCount ? String(matchCount > 9999 ? "9999+" : matchCount) : "…"}
                      centerLabel="공고건"
                      height={200}
                    />
                  </Suspense>
                  <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--bg)", borderRadius: 10 }}>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>지역별 신청 현황 (최근)</div>
                    {statItems.slice(0, 5).map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: i < 4 ? "1px solid var(--line)" : "none" }}>
                        <span style={{ fontWeight: 600 }}>{String(item.SUBSCRPT_AREA_CODE_NM ?? "-")}</span>
                        <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                          {(Number(item.AGE_30) + Number(item.AGE_40) + Number(item.AGE_50) + Number(item.AGE_60)).toLocaleString()}건
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>

        <footer style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", padding: "16px 0 24px", borderTop: "1px solid var(--line)", marginTop: 8 }}>
          데이터 출처: 공공데이터포털 · 한국부동산원 청약홈 API
        </footer>
      </main>
    </div>
  );
}

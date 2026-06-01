"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

// GeoJSON 시도명 → API 지역명 매핑
const GEO_NAME_MAP: Record<string, string> = {
  "서울특별시": "서울",
  "부산광역시": "부산",
  "대구광역시": "대구",
  "인천광역시": "인천",
  "광주광역시": "광주",
  "대전광역시": "대전",
  "울산광역시": "울산",
  "세종특별자치시": "세종",
  "경기도": "경기",
  "강원도": "강원",
  "충청북도": "충북",
  "충청남도": "충남",
  "전라북도": "전북",
  "전라남도": "전남",
  "경상북도": "경북",
  "경상남도": "경남",
  "제주특별자치도": "제주",
};

interface RegionData {
  name: string;   // 짧은 지역명 (서울, 경기 등)
  value: number;
}

interface KoreaMapProps {
  data: RegionData[];
  onSelect?: (name: string) => void;
  selected?: string;
  colorRange?: [string, string];
  height?: number;
}

// globalThis 플래그로 중복 등록 방지
const g = globalThis as typeof globalThis & { __koreaMapRegistered?: boolean };

export default function KoreaMap({
  data, onSelect, selected,
  colorRange = ["#DBEAFE", "#1D4ED8"],
  height = 400,
}: KoreaMapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (g.__koreaMapRegistered) { setReady(true); return; }
    import("echarts").then((echarts) => {
      fetch("/geo/korea-provinces.geo.json")
        .then((r) => r.json())
        .then((geo) => {
          // GeoJSON 시도명을 짧은 이름으로 정규화
          geo.features = geo.features.map((f: { properties: { name: string } }) => ({
            ...f,
            properties: {
              ...f.properties,
              name: GEO_NAME_MAP[f.properties.name] ?? f.properties.name,
            },
          }));
          echarts.registerMap("korea", geo);
          g.__koreaMapRegistered = true;
          setReady(true);
        });
    });
  }, []);

  if (!ready) return (
    <div style={{ height, background: "var(--track)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "var(--muted)", fontSize: 13 }}>지도 로딩 중…</span>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const option: Record<string, any> = {
    tooltip: {
      trigger: "item",
      formatter: (params: { name: string; value: number | string }) =>
        `${params.name}<br/>신청건수: <b>${Number(params.value || 0).toLocaleString()}건</b>`,
    },
    visualMap: {
      min: 0,
      max: Math.max(...data.map(d => d.value), 1),
      text: ["높음", "낮음"],
      realtime: false,
      calculable: true,
      inRange: { color: colorRange },
      textStyle: { fontSize: 11, color: "#64748B" },
    },
    series: [{
      name: "청약 신청",
      type: "map",
      map: "korea",
      roam: false,
      emphasis: {
        label: { show: true, fontSize: 12, fontWeight: "bold" },
        itemStyle: { areaColor: "#F59E0B" },
      },
      select: {
        itemStyle: { areaColor: "#F59E0B" },
        label: { show: true },
      },
      selectedMode: "single",
      data: data.map(d => ({
        name: d.name,
        value: d.value,
        selected: d.name === selected,
      })),
      label: { show: true, fontSize: 10, color: "#1E293B" },
      itemStyle: { borderColor: "#fff", borderWidth: 1 },
    }],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      notMerge
      onEvents={{
        click: (params: { name: string }) => onSelect?.(params.name),
      }}
    />
  );
}

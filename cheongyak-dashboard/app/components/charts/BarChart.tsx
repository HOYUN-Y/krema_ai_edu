"use client";

import EChart from "./EChart";

interface BarItem {
  name: string;
  value: number;
  sub?: string;
}

interface BarChartProps {
  data: BarItem[];
  unit?: string;
  height?: number;
  colorScale?: boolean; // 경쟁률 히트맵 색상 적용
}

function heatColor(rate: number): string {
  if (rate >= 200) return "#DC2626";
  if (rate >= 100) return "#EF4444";
  if (rate >= 50)  return "#F97316";
  if (rate >= 25)  return "#FB923C";
  if (rate >= 12)  return "#FCD34D";
  if (rate >= 6)   return "#93C5FD";
  if (rate >= 3)   return "#BFDBFE";
  return "#DBEAFE";
}

export default function BarChart({ data, unit = ":1", height = 260, colorScale = false }: BarChartProps) {
  const sorted = [...data].sort((a, b) => a.value - b.value);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/><b>${p.value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}${unit}</b>`;
      },
    },
    grid: { left: 140, right: 60, top: 10, bottom: 10, containLabel: false },
    xAxis: {
      type: "value",
      axisLabel: { fontSize: 10, color: "#64748B" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    yAxis: {
      type: "category",
      data: sorted.map(d => d.name),
      axisLabel: { fontSize: 12, color: "#0F172A", fontWeight: "bold" },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [{
      type: "bar",
      data: sorted.map(d => ({
        value: d.value,
        itemStyle: { color: colorScale ? heatColor(d.value) : "#3B82F6", borderRadius: [0, 4, 4, 0] },
      })),
      label: {
        show: true,
        position: "right",
        fontSize: 11,
        fontWeight: "bold",
        color: "#0F172A",
        formatter: (p: { value: number }) =>
          `${p.value.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}${unit}`,
      },
      barMaxWidth: 20,
    }],
  };

  return <EChart option={option} height={height} />;
}

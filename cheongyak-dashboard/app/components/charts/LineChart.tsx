"use client";

import EChart from "./EChart";

interface LineItem {
  month: string;
  value: number;
}

interface LineChartProps {
  data: LineItem[];
  color?: string;
  unit?: string;
  height?: number;
  smooth?: boolean;
  area?: boolean;
}

export default function LineChart({
  data, color = "#2563EB", unit = "", height = 200, smooth = true, area = true,
}: LineChartProps) {
  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: { name: string; value: number }[]) => {
        const p = params[0];
        return `${p.name}<br/><b>${p.value.toLocaleString()}${unit}</b>`;
      },
    },
    grid: { left: 40, right: 16, top: 16, bottom: 24 },
    xAxis: {
      type: "category",
      data: data.map(d => d.month),
      axisLabel: { fontSize: 10, color: "#64748B" },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: "#E6EAF0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 10, color: "#64748B" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: "line",
      data: data.map(d => d.value),
      smooth,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { color, width: 2.5 },
      itemStyle: { color, borderColor: "#fff", borderWidth: 2 },
      areaStyle: area ? {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: color + "38" },
            { offset: 1, color: color + "00" },
          ],
        },
      } : undefined,
    }],
  };

  return <EChart option={option} height={height} />;
}

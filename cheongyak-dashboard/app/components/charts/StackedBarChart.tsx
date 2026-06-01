"use client";

import EChart from "./EChart";

interface StackedBarChartProps {
  categories: string[];
  series: { name: string; data: number[]; color: string }[];
  height?: number;
  horizontal?: boolean;
}

export default function StackedBarChart({
  categories, series, height = 280, horizontal = false,
}: StackedBarChartProps) {
  const option = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 11, color: "#64748B" },
      itemWidth: 10, itemHeight: 10,
    },
    grid: {
      left: horizontal ? 80 : 16,
      right: 16,
      top: 10,
      bottom: 36,
      containLabel: !horizontal,
    },
    xAxis: horizontal
      ? { type: "value", axisLabel: { fontSize: 10, color: "#64748B" }, splitLine: { lineStyle: { color: "#F1F5F9" } } }
      : { type: "category", data: categories, axisLabel: { fontSize: 10, color: "#0F172A", rotate: 30 }, axisTick: { show: false } },
    yAxis: horizontal
      ? { type: "category", data: categories, axisLabel: { fontSize: 11, color: "#0F172A", fontWeight: "bold" }, axisTick: { show: false }, axisLine: { show: false } }
      : { type: "value", axisLabel: { fontSize: 10, color: "#64748B" }, splitLine: { lineStyle: { color: "#F1F5F9" } }, axisLine: { show: false } },
    series: series.map(s => ({
      name: s.name,
      type: "bar",
      stack: "total",
      data: s.data,
      itemStyle: { color: s.color, borderRadius: 0 },
      emphasis: { focus: "series" },
      barMaxWidth: horizontal ? 20 : 32,
    })),
  };

  return <EChart option={option} height={height} />;
}

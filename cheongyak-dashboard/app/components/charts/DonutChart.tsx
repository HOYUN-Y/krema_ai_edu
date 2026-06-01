"use client";

import EChart from "./EChart";

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutItem[];
  centerValue?: string;
  centerLabel?: string;
  height?: number;
}

export default function DonutChart({ data, centerValue, centerLabel, height = 200 }: DonutChartProps) {
  const option = {
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/><b>${p.value}%</b> (${p.percent.toFixed(1)}%)`,
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      textStyle: { fontSize: 12, color: "#0F172A" },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [{
      type: "pie",
      radius: ["48%", "70%"],
      center: ["38%", "50%"],
      avoidLabelOverlap: false,
      label: {
        show: centerValue ? true : false,
        position: "center",
        formatter: () => centerValue
          ? `{val|${centerValue}}\n{lab|${centerLabel ?? ""}}`
          : "",
        rich: {
          val: { fontSize: 22, fontWeight: "bold", color: "#0F172A", lineHeight: 28 },
          lab: { fontSize: 11, color: "#64748B", lineHeight: 18 },
        },
      },
      emphasis: { label: { show: true } },
      data: data.map(d => ({
        name: d.label,
        value: d.value,
        itemStyle: { color: d.color },
      })),
    }],
  };

  return <EChart option={option} height={height} />;
}

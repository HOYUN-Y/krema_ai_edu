"use client";

import dynamic from "next/dynamic";
// SSR 불가 — dynamic import 필수
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface EChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: Record<string, any>;
  height?: number | string;
  style?: React.CSSProperties;
}

export default function EChart({ option, height = 260, style }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%", ...style }}
      notMerge
      lazyUpdate
    />
  );
}

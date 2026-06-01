"use client";
import { heatColor } from "./ui";

export function HBarRank({ data, valueKey = "rate", labelKey = "name", subKey, unit = ":1" }: {
  data: Record<string, string | number>[];
  valueKey?: string; labelKey?: string; subKey?: string; unit?: string;
}) {
  const top = Math.max(...data.map((d) => Number(d[valueKey]) || 0)) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const w = Math.max(2, (val / top) * 100);
        return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "150px 1fr 86px", alignItems: "center", gap: 12 }}>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{String(d[labelKey] ?? "")}</div>
              {subKey && <div style={{ fontSize: 11, color: "var(--muted)" }}>{String(d[subKey] ?? "")}</div>}
            </div>
            <div style={{ background: "var(--track)", borderRadius: 5, height: 26, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, width: w + "%", background: heatColor(val), borderRadius: 5, transition: "width .6s cubic-bezier(.4,0,.2,1)" }} />
            </div>
            <div style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {val.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}<span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 500 }}>{unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AreaLine({ data, valueKey = "rate", color = "#2563EB" }: {
  data: Record<string, string | number>[];
  valueKey?: string; color?: string;
}) {
  const w = 520, h = 180;
  const pad = { t: 16, r: 12, b: 26, l: 36 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...vals) * 1.15 || 1;
  const X = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * iw;
  const Y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = data.map((d, i) => `${X(i)},${Y(Number(d[valueKey]) || 0)}`).join(" ");
  const area = `${pad.l},${pad.t + ih} ${line} ${X(data.length - 1)},${pad.t + ih}`;
  const ticks = [0, 0.5, 1].map((t) => max * t);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="al-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={pad.l} x2={pad.l + iw} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeWidth="1" />
          <text x={pad.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)">{Math.round(t)}</text>
        </g>
      ))}
      <polygon points={area} fill="url(#al-grad)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Y(Number(d[valueKey]) || 0)} r="3.2" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={X(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{String(d.month ?? d.STAT_DE ?? "")}</text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ data, centerLabel, centerValue }: {
  data: { label: string; value: number; color: string }[];
  centerLabel?: string; centerValue?: string;
}) {
  const size = 160, thick = 26;
  const r = (size - thick) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * circ;
            const el = (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thick}
                strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />
            );
            offset += len;
            return el;
          })}
        </g>
        {centerValue && <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ink)">{centerValue}</text>}
        {centerLabel && <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{centerLabel}</text>}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ fontSize: 12.5, color: "var(--ink)", fontWeight: 600 }}>{d.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

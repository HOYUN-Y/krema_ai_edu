"use client";
import React from "react";

export function Card({
  title, sub, right, children, pad = 18, style,
}: {
  title?: string; sub?: string; right?: React.ReactNode;
  children: React.ReactNode; pad?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14,
      boxShadow: "var(--shadow)", display: "flex", flexDirection: "column", ...style,
    }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: `${pad}px ${pad}px 0`, gap: 10 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}

export function Delta({ value, invert }: { value: number; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 700, color: good ? "#059669" : "#DC2626", fontVariantNumeric: "tabular-nums" }}>
      <span style={{ fontSize: 9 }}>{up ? "▲" : "▼"}</span>{Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function Sparkline({ data, color = "#2563EB" }: { data: number[]; color?: string }) {
  const w = 88, h = 30;
  const max = Math.max(...data), min = Math.min(...data);
  const X = (i: number) => (i / (data.length - 1)) * w;
  const Y = (v: number) => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const line = data.map((v, i) => `${X(i)},${Y(v)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}

export function KpiCard({ label, value, unit, delta, sub, spark, sparkColor }: {
  label: string; value: string; unit: string; delta: number; sub: string;
  spark?: number[]; sparkColor?: string;
}) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, boxShadow: "var(--shadow)" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span className="kpi-value" style={{ fontSize: 27, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</span>
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{unit}</span>
        </div>
        {spark && <span className="kpi-spark"><Sparkline data={spark} color={sparkColor || "#2563EB"} /></span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <Delta value={delta} invert={label.includes("분양가율")} />
        <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{sub}</span>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    "접수중": ["#059669", "#ECFDF5"],
    "접수예정": ["#1D4ED8", "#EFF6FF"],
    "마감": ["#64748B", "#F1F5F9"],
  };
  const [c, bg] = map[status] ?? ["#64748B", "#F1F5F9"];
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: bg, padding: "2px 8px", borderRadius: 20 }}>{status}</span>;
}

export function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(37,99,235,.35)" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 11L6 6L9.5 9L14 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="14" cy="3.5" r="1.6" fill="#fff" />
        </svg>
      </div>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>청약 인사이트</div>
      </div>
    </div>
  );
}

export function Chip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12.5, fontWeight: 600, padding: "6px 13px", borderRadius: 20, cursor: "pointer",
      border: "1px solid " + (active ? "var(--ink)" : "var(--line)"),
      background: active ? "var(--ink)" : "var(--surface)", color: active ? "#fff" : "var(--ink)",
      transition: "all .15s", whiteSpace: "nowrap", fontFamily: "inherit",
    }}>{label}</button>
  );
}

export function heatColor(rate: number): string {
  const HEAT = ["#DBEAFE", "#BFDBFE", "#93C5FD", "#FCD34D", "#FB923C", "#F97316", "#EF4444", "#DC2626"];
  if (rate >= 200) return HEAT[7];
  if (rate >= 100) return HEAT[6];
  if (rate >= 50)  return HEAT[5];
  if (rate >= 25)  return HEAT[4];
  if (rate >= 12)  return HEAT[3];
  if (rate >= 6)   return HEAT[2];
  if (rate >= 3)   return HEAT[1];
  return HEAT[0];
}

export function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

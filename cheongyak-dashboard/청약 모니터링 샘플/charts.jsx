// charts.jsx — 재사용 SVG 차트 프리미티브 (청약 대시보드)
// window 로 export. React 전역 사용.
const { useState } = React;

// ── 색/스케일 헬퍼 ─────────────────────────────────────────────
const HEAT = ['#DBEAFE', '#BFDBFE', '#93C5FD', '#FCD34D', '#FB923C', '#F97316', '#EF4444', '#DC2626'];
function heatColor(rate) {
  // 경쟁률 → 색 (낮음=쿨, 높음=웜)
  if (rate >= 200) return HEAT[7];
  if (rate >= 100) return HEAT[6];
  if (rate >= 50)  return HEAT[5];
  if (rate >= 25)  return HEAT[4];
  if (rate >= 12)  return HEAT[3];
  if (rate >= 6)   return HEAT[2];
  if (rate >= 3)   return HEAT[1];
  return HEAT[0];
}
function fmt(n) { return n.toLocaleString('ko-KR'); }

// ── 가로 막대 랭킹 (경쟁률) ───────────────────────────────────
function HBarRank({ data, max, valueKey = 'rate', labelKey = 'name', subKey, unit = ':1', height = 26, gap = 12 }) {
  const top = max || Math.max(...data.map(d => d[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: gap }}>
      {data.map((d, i) => {
        const w = Math.max(2, (d[valueKey] / top) * 100);
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 86px', alignItems: 'center', gap: 12 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{d[labelKey]}</div>
              {subKey && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{d[subKey]}</div>}
            </div>
            <div style={{ background: 'var(--track)', borderRadius: 5, height: height, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, width: w + '%', background: heatColor(d[valueKey]), borderRadius: 5, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
              {d[valueKey].toLocaleString('ko-KR', { maximumFractionDigits: 1 })}<span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 덤벨 비교 (분양가 vs 시세) ────────────────────────────────
function Dumbbell({ data, height = 220 }) {
  const all = data.flatMap(d => [d.price, d.marketPrice]);
  const min = Math.min(...all) * 0.96, max = Math.max(...all) * 1.02;
  const x = v => ((v - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {data.map((d, i) => {
        const x1 = x(d.price), x2 = x(d.marketPrice);
        const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
        const gap = ((d.marketPrice - d.price) / d.price) * 100;
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 66px', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
            <div style={{ position: 'relative', height: 18 }}>
              <div style={{ position: 'absolute', top: '50%', left: lo + '%', width: (hi - lo) + '%', height: 3, transform: 'translateY(-50%)', background: 'var(--line)', borderRadius: 2 }}></div>
              <div title="분양가" style={{ position: 'absolute', top: '50%', left: x1 + '%', width: 11, height: 11, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#2563EB', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.18)' }}></div>
              <div title="시세" style={{ position: 'absolute', top: '50%', left: x2 + '%', width: 11, height: 11, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#0F172A', border: '2px solid #fff', boxShadow: '0 1px 3px rgba(0,0,0,.18)' }}></div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: gap > 12 ? '#DC2626' : 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
              +{gap.toFixed(0)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 영역 라인 (추이) ──────────────────────────────────────────
function AreaLine({ data, valueKey = 'rate', w = 520, h = 180, color = '#2563EB', unit = ':1' }) {
  const pad = { t: 16, r: 12, b: 26, l: 36 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const vals = data.map(d => d[valueKey]);
  const max = Math.max(...vals) * 1.15, min = 0;
  const X = i => pad.l + (i / (data.length - 1)) * iw;
  const Y = v => pad.t + ih - ((v - min) / (max - min)) * ih;
  const line = data.map((d, i) => `${X(i)},${Y(d[valueKey])}`).join(' ');
  const area = `${pad.l},${pad.t + ih} ${line} ${pad.l + iw},${pad.t + ih}`;
  const ticks = [0, 0.5, 1].map(t => min + (max - min) * t);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
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
          <circle cx={X(i)} cy={Y(d[valueKey])} r="3.2" fill="#fff" stroke={color} strokeWidth="2" />
          <text x={X(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{d.month}</text>
        </g>
      ))}
    </svg>
  );
}

// ── 세로 막대 + 라인 콤보 (공급/경쟁률) ───────────────────────
function ComboBars({ data, w = 520, h = 200 }) {
  const pad = { t: 16, r: 12, b: 26, l: 8 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const maxS = Math.max(...data.map(d => d.supply)) * 1.1;
  const maxR = Math.max(...data.map(d => d.rate)) * 1.2;
  const bw = (iw / data.length) * 0.5;
  const X = i => pad.l + (i + 0.5) * (iw / data.length);
  const Yr = v => pad.t + ih - (v / maxR) * ih;
  const lineR = data.map((d, i) => `${X(i)},${Yr(d.rate)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.map((d, i) => {
        const bh = (d.supply / maxS) * ih;
        return <rect key={i} x={X(i) - bw / 2} y={pad.t + ih - bh} width={bw} height={bh} rx="3" fill="#CBD5E1" />;
      })}
      <polyline points={lineR} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Yr(d.rate)} r="3" fill="#F97316" />
          <text x={X(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fill="var(--muted)">{d.month}</text>
        </g>
      ))}
    </svg>
  );
}

// ── 타일 그리드 지도 (지역 경쟁률 코로플레스) ─────────────────
function TileMap({ regions, metric = 'avgRate', onHover, cell = 46, gapPx = 5 }) {
  const cols = Math.max(...regions.map(r => r.tile[0])) + 1;
  const rows = Math.max(...regions.map(r => r.tile[1])) + 1;
  const [hover, setHover] = useState(null);
  return (
    <div style={{ position: 'relative', width: cols * (cell + gapPx), margin: '0 auto' }}>
      <div style={{ position: 'relative', width: cols * (cell + gapPx), height: rows * (cell + gapPx) }}>
        {regions.map(r => {
          const v = r[metric];
          const c = metric === 'avgRate' ? heatColor(v) : v;
          const isHot = metric === 'avgRate' && v >= 50;
          return (
            <div key={r.code}
              onMouseEnter={() => { setHover(r.code); onHover && onHover(r); }}
              onMouseLeave={() => { setHover(null); onHover && onHover(null); }}
              style={{
                position: 'absolute', left: r.tile[0] * (cell + gapPx), top: r.tile[1] * (cell + gapPx),
                width: cell, height: cell, borderRadius: 8, background: c,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'transform .15s, box-shadow .15s',
                transform: hover === r.code ? 'scale(1.08)' : 'scale(1)',
                boxShadow: hover === r.code ? '0 6px 16px rgba(15,23,42,.22)' : 'none',
                outline: hover === r.code ? '2px solid var(--ink)' : 'none', zIndex: hover === r.code ? 5 : 1,
              }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isHot ? '#fff' : 'var(--ink)' }}>{r.name}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: isHot ? 'rgba(255,255,255,.9)' : 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                {metric === 'avgRate' ? v.toFixed(0) : fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 도넛 ──────────────────────────────────────────────────────
function Donut({ data, size = 160, thick = 26, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - thick) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * circ;
            const seg = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thick}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return seg;
          })}
        </g>
        {centerValue && <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--ink)">{centerValue}</text>}
        {centerLabel && <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{centerLabel}</text>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }}></span>
            <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 600 }}>{d.label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 스파크라인 ────────────────────────────────────────────────
function Sparkline({ data, w = 88, h = 30, color = '#2563EB' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const X = i => (i / (data.length - 1)) * w;
  const Y = v => h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
  const line = data.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r="2.5" fill={color} />
    </svg>
  );
}

// ── 미니 캘린더 (청약 일정) ───────────────────────────────────
function ScheduleCalendar({ events, year = 2026, month = 6 }) {
  const first = new Date(year, month - 1, 1);
  const startDay = first.getDay();
  const days = new Date(year, month, 0).getDate();
  const byDay = {};
  events.forEach(e => {
    const d = new Date(e.apply).getDate();
    (byDay[d] = byDay[d] || []).push(e);
  });
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
        {wd.map((w, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: i === 0 ? '#DC2626' : 'var(--muted)' }}>{w}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          const evs = d ? (byDay[d] || []) : [];
          const has = evs.length > 0;
          return (
            <div key={i} style={{
              minHeight: 44, borderRadius: 7, padding: '4px 5px',
              background: has ? '#EFF6FF' : 'transparent',
              border: has ? '1px solid #BFDBFE' : '1px solid transparent',
            }}>
              {d && <div style={{ fontSize: 11, fontWeight: 600, color: i % 7 === 0 ? '#DC2626' : 'var(--ink)' }}>{d}</div>}
              {evs.slice(0, 1).map((e, j) => (
                <div key={j} style={{ fontSize: 9.5, fontWeight: 600, color: '#1D4ED8', lineHeight: 1.2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
              ))}
              {evs.length > 1 && <div style={{ fontSize: 9, color: 'var(--muted)' }}>+{evs.length - 1}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { HBarRank, Dumbbell, AreaLine, ComboBars, TileMap, Donut, Sparkline, ScheduleCalendar, heatColor, fmt });

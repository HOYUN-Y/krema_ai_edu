// ui.jsx — 공통 UI 프리미티브 (청약 대시보드)
function Card({ title, sub, right, children, pad = 18, style }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', ...style }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: `${pad}px ${pad}px 0`, gap: 10 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</div>
            {sub && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  );
}

function Delta({ value, invert }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, fontWeight: 700, color: good ? '#059669' : '#DC2626', fontVariantNumeric: 'tabular-nums' }}>
      <span style={{ fontSize: 9 }}>{up ? '▲' : '▼'}</span>{Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({ k, spark, sparkColor }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{k.label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontSize: 27, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{k.value}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{k.unit}</span>
        </div>
        {spark && <Sparkline data={spark} color={sparkColor || '#2563EB'} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <Delta value={k.delta} invert={k.label.includes('분양가율')} />
        <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{k.sub}</span>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = { '접수중': ['#059669', '#ECFDF5'], '접수예정': ['#1D4ED8', '#EFF6FF'], '마감': ['#64748B', '#F1F5F9'] };
  const [c, bg] = map[status] || map['접수예정'];
  return <span style={{ fontSize: 11, fontWeight: 700, color: c, background: bg, padding: '2px 8px', borderRadius: 20 }}>{status}</span>;
}

function Logo({ dark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(37,99,235,.35)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 11L6 6L9.5 9L14 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="3.5" r="1.6" fill="#fff" /></svg>
      </div>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: dark ? '#fff' : 'var(--ink)', letterSpacing: '-0.02em' }}>청약 인사이트</div>
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 20, cursor: 'pointer',
      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--line)'),
      background: active ? 'var(--ink)' : 'var(--surface)', color: active ? '#fff' : 'var(--ink)',
      transition: 'all .15s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

function Legend() {
  const stops = [
    ['#DBEAFE', '~3'], ['#93C5FD', '12'], ['#FCD34D', '25'], ['#FB923C', '50'], ['#F97316', '100'], ['#DC2626', '200+'],
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {stops.map((s, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 26, height: 9, background: s[0], borderRadius: i === 0 ? '3px 0 0 3px' : i === stops.length - 1 ? '0 3px 3px 0' : 0 }}></span>
          <span style={{ fontSize: 9, color: 'var(--muted)' }}>{s[1]}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Card, Delta, KpiCard, StatusPill, Logo, Chip, Legend });

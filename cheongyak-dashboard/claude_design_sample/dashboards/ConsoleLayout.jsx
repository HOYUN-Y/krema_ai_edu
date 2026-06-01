// ConsoleLayout.jsx — Layout A · 분석 콘솔 (사이드바 + KPI + 차트 그리드)
function ConsoleLayout() {
  const D = window.CHEONGYAK_DATA;
  const ranked = [...D.complexes].sort((a, b) => b.rate - a.rate).slice(0, 8);
  const dumbbell = [...D.complexes].sort((a, b) => (b.marketPrice - b.price) - (a.marketPrice - a.price)).slice(0, 7);
  const nav = [
    ['◧', '대시보드', true], ['▦', '경쟁률 분석', false], ['⇅', '분양가·시세', false],
    ['◉', '지역 현황', false], ['▤', '청약 일정', false], ['★', '관심 단지', false],
  ];
  return (
    <div style={{ display: 'flex', width: 1440, minHeight: 1180, background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--ink)' }}>
      {/* Sidebar */}
      <aside style={{ width: 224, background: 'var(--surface)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--line)' }}><Logo /></div>
        <nav style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(([ic, label, active], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
              background: active ? '#EFF6FF' : 'transparent', color: active ? '#1D4ED8' : 'var(--muted)', fontWeight: active ? 700 : 600, fontSize: 13.5 }}>
              <span style={{ fontSize: 15, width: 18, textAlign: 'center' }}>{ic}</span>{label}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1E293B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>박</div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>박지훈 애널리스트</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>리서치팀</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>전국 청약 현황 대시보드</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>2026년 6월 · 데이터 기준일 06.01</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chip label="전체" active />
            <Chip label="수도권" />
            <Chip label="민영" />
            <div style={{ width: 200, height: 36, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: 'var(--muted)', fontSize: 13 }}>
              <span>⌕</span> 단지·지역 검색
            </div>
          </div>
        </header>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            <KpiCard k={D.kpis[0]} spark={[8, 9, 7, 10, 11, 12]} />
            <KpiCard k={D.kpis[1]} spark={D.trend.map(t => t.rate)} sparkColor="#F97316" />
            <KpiCard k={D.kpis[2]} spark={D.trend.map(t => t.supply)} sparkColor="#0D9488" />
            <KpiCard k={D.kpis[3]} spark={[90, 89, 91, 88, 87, 86]} sparkColor="#7C3AED" />
          </div>

          {/* Row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18 }}>
            <Card title="단지별 경쟁률 TOP 8" sub="1순위 평균 경쟁률 · 색상 = 과열 정도">
              <HBarRank data={ranked} labelKey="name" subKey="gu" valueKey="rate" />
            </Card>
            <Card title="지역별 평균 경쟁률" sub="시·도 기준 코로플레스" right={<Legend />}>
              <TileMap regions={D.regions} metric="avgRate" />
            </Card>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.1fr 0.95fr', gap: 18 }}>
            <Card title="분양가 vs 시세 갭" sub="● 분양가  ● 시세 (만원/3.3㎡)">
              <Dumbbell data={dumbbell} />
            </Card>
            <Card title="월별 경쟁률 추이" sub="전국 1순위 평균">
              <AreaLine data={D.trend} valueKey="rate" />
            </Card>
            <Card title="공급 유형 구성" sub="2026년 6월 기준">
              <Donut data={D.supplyTypes} centerValue="127" centerLabel="단지" />
            </Card>
          </div>

          {/* Row 4 — schedule table */}
          <Card title="청약 일정" sub="다가오는 접수 단지">
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1.4fr 1fr 0.8fr 0.8fr 0.8fr 90px', gap: 0, fontSize: 12.5 }}>
              <div style={{ display: 'contents' }}>
                {['접수일', '단지명', '지역', '유형', '공급', '경쟁률(예측)', '상태'].map((h, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', padding: '0 8px 10px', borderBottom: '1px solid var(--line)' }}>{h}</div>
                ))}
              </div>
              {[...D.complexes].sort((a, b) => a.apply.localeCompare(b.apply)).slice(0, 8).map((c, i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', fontWeight: 700, color: '#1D4ED8', fontVariantNumeric: 'tabular-nums' }}>{c.apply.slice(5).replace('-', '.')}</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{c.sido} {c.gu}</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{c.type}</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.units)}</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)', fontWeight: 700, color: heatColor(c.rate), fontVariantNumeric: 'tabular-nums' }}>{c.rate.toFixed(1)}:1</div>
                  <div style={{ padding: '12px 8px', borderBottom: '1px solid var(--line)' }}><StatusPill status={c.status} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
window.ConsoleLayout = ConsoleLayout;

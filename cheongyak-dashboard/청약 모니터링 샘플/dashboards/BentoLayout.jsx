// BentoLayout.jsx — Layout C · 벤토 모듈형 (에디토리얼)
function BentoLayout() {
  const D = window.CHEONGYAK_DATA;
  const ranked = [...D.complexes].sort((a, b) => b.rate - a.rate).slice(0, 6);
  const dumbbell = [...D.complexes].sort((a, b) => (b.marketPrice - b.price) - (a.marketPrice - a.price)).slice(0, 6);
  const hot = ranked[0];

  return (
    <div style={{ width: 1440, minHeight: 1120, background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--ink)', padding: 30 }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Logo />
          <div style={{ width: 1, height: 26, background: 'var(--line)' }}></div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 600 }}>전국 청약 인사이트 · 2026.06</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Chip label="전국" active />
          <Chip label="수도권" />
          <Chip label="광역시" />
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1E293B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>박</div>
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Row 1 — hero + donut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr 0.9fr', gap: 20 }}>
          {/* dark hero */}
          <div style={{ background: 'linear-gradient(150deg,#0F172A,#1E3A8A)', borderRadius: 18, padding: 24, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.75)' }}>전국 평균 경쟁률</div>
              <Delta value={D.kpis[1].delta} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>44.2</span>
              <span style={{ fontSize: 18, color: 'rgba(255,255,255,.7)' }}>: 1</span>
            </div>
            <div style={{ marginTop: 4, marginLeft: -4 }}>
              <AreaLine data={D.trend} valueKey="rate" w={360} h={92} color="#93C5FD" />
            </div>
          </div>
          {/* two KPI tiles stacked */}
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 20 }}>
            <KpiCard k={D.kpis[0]} spark={[8, 9, 7, 10, 11, 12]} />
            <KpiCard k={D.kpis[2]} spark={D.trend.map(t => t.supply)} sparkColor="#0D9488" />
          </div>
          <Card title="공급 유형" sub="2026.06 분양 기준" pad={18} style={{ justifyContent: 'center' }}>
            <Donut data={D.supplyTypes} size={150} centerValue="127" centerLabel="단지" />
          </Card>
        </div>

        {/* Row 2 — ranking + map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card title="🔥 경쟁률 과열 단지 TOP 6" sub="1순위 평균 경쟁률">
            <HBarRank data={ranked} labelKey="name" subKey="gu" valueKey="rate" gap={13} />
          </Card>
          <Card title="지역별 청약 히트맵" sub="시·도 평균 경쟁률" right={<Legend />}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
              <TileMap regions={D.regions} metric="avgRate" cell={44} gapPx={5} />
            </div>
          </Card>
        </div>

        {/* Row 3 — dumbbell + combo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20 }}>
          <Card title="분양가 vs 시세 갭" sub="● 분양가  ● 시세 · 갭 큰 순 (만원/3.3㎡)">
            <Dumbbell data={dumbbell} />
          </Card>
          <Card title="월별 공급·경쟁률" sub="막대=공급세대  선=평균 경쟁률">
            <ComboBars data={D.trend} h={190} />
          </Card>
        </div>

        {/* Row 4 — calendar */}
        <Card title="6월 청약 일정" sub="접수 단지가 표시된 날짜">
          <ScheduleCalendar events={D.complexes.filter(c => c.apply.startsWith('2026-06'))} />
        </Card>
      </div>
    </div>
  );
}
window.BentoLayout = BentoLayout;

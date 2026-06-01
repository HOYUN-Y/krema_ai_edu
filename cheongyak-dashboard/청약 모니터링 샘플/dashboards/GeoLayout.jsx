// GeoLayout.jsx — Layout B · 지도 중심 (geo-first)
function GeoLayout() {
  const D = window.CHEONGYAK_DATA;
  const { useState } = React;
  const [metric, setMetric] = useState('avgRate');
  const [sel, setSel] = useState(D.regions.find(r => r.code === '서울'));
  const regionRank = [...D.regions].sort((a, b) => b.avgRate - a.avgRate).slice(0, 8)
    .map(r => ({ name: r.name, gu: r.projects + '개 단지', rate: r.avgRate }));
  const selComplexes = D.complexes.filter(c => c.sido === sel.code);

  return (
    <div style={{ width: 1440, minHeight: 980, background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <header style={{ height: 66, background: 'var(--surface)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Logo />
          <div style={{ display: 'flex', gap: 4 }}>
            {['지도', '경쟁률', '분양가', '일정'].map((t, i) => (
              <div key={i} style={{ fontSize: 13.5, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? 'var(--ink)' : 'var(--muted)', padding: '8px 12px', borderBottom: i === 0 ? '2px solid #2563EB' : '2px solid transparent' }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>지표</span>
          <Chip label="평균 경쟁률" active={metric === 'avgRate'} onClick={() => setMetric('avgRate')} />
          <Chip label="공급 세대" active={metric === 'supply'} onClick={() => setMetric('supply')} />
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 440px', gap: 0 }}>
        {/* Map hero */}
        <section style={{ padding: 28, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>전국 청약 히트맵</h2>
            <Legend />
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 8px' }}>지역을 클릭하면 우측에 상세 현황이 표시됩니다 · {metric === 'avgRate' ? '평균 경쟁률(:1)' : '공급 세대 수'}</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow)', position: 'relative' }}>
            <div style={{ transform: 'scale(1.7)' }}>
              <TileMap regions={D.regions} metric={metric} onHover={(r) => r && setSel(r)} cell={48} gapPx={6} />
            </div>
            <div style={{ position: 'absolute', left: 22, bottom: 20, fontSize: 11, color: 'var(--muted)' }}>* 행정구역 근사 타일 배치 · 더미 데이터</div>
          </div>
          {/* bottom strip: trend */}
          <div style={{ marginTop: 18 }}>
            <Card title="전국 월별 공급·경쟁률" sub="막대=공급세대  선=평균 경쟁률" pad={16}>
              <ComboBars data={D.trend} h={150} />
            </Card>
          </div>
        </section>

        {/* Right rail */}
        <aside style={{ background: 'var(--surface)', borderLeft: '1px solid var(--line)', padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
          {/* Selected region detail */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 14, borderRadius: 4, background: heatColor(sel.avgRate) }}></span>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{sel.name}</h3>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{sel.projects}개 분양 단지</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>평균 경쟁률</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: heatColor(sel.avgRate), fontVariantNumeric: 'tabular-nums' }}>{sel.avgRate.toFixed(1)}<span style={{ fontSize: 13, color: 'var(--muted)' }}>:1</span></div>
              </div>
              <div style={{ background: 'var(--bg)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>총 공급 세대</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{fmt(sel.supply)}</div>
              </div>
            </div>
          </div>

          {/* complexes in region */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{sel.name} 주요 단지</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(selComplexes.length ? selComplexes : [{ name: '예정 단지 없음', gu: '', rate: 0, units: 0, type: '', apply: '' }]).slice(0, 4).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    {c.gu && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.gu} · {c.type} · {fmt(c.units)}세대</div>}
                  </div>
                  {c.rate > 0 && <div style={{ fontSize: 15, fontWeight: 800, color: heatColor(c.rate), fontVariantNumeric: 'tabular-nums' }}>{c.rate.toFixed(0)}:1</div>}
                </div>
              ))}
            </div>
          </div>

          {/* region ranking */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>지역별 경쟁률 랭킹</div>
            <HBarRank data={regionRank} labelKey="name" subKey="gu" valueKey="rate" height={20} gap={9} />
          </div>
        </aside>
      </div>
    </div>
  );
}
window.GeoLayout = GeoLayout;

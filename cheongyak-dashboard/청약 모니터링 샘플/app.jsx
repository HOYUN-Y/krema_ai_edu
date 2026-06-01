// app.jsx — 3개 레이아웃을 디자인 캔버스에 배치
function App() {
  return (
    <DesignCanvas>
      <DCSection id="layouts" title="청약 인사이트 대시보드" subtitle="더미 데이터 · 데스크톱 웹 · 레이아웃 3안">
        <DCArtboard id="a" label="A · 분석 콘솔 (사이드바 + 차트 그리드)" width={1440} height={1180}>
          <ConsoleLayout />
        </DCArtboard>
        <DCArtboard id="b" label="B · 지도 중심 (geo-first · 인터랙티브)" width={1440} height={980}>
          <GeoLayout />
        </DCArtboard>
        <DCArtboard id="c" label="C · 벤토 모듈형 (에디토리얼)" width={1440} height={1120}>
          <BentoLayout />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);

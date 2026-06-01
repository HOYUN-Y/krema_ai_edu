// 청약 인사이트 대시보드 — 더미 데이터
// 모든 수치는 예시용 가상 데이터입니다.
(function () {
  // ── 단지별 청약 데이터 ──────────────────────────────────────────
  // price/marketPrice: 만원 / 3.3㎡ (평당)
  // rate: 1순위 평균 경쟁률 (n:1)
  const complexes = [
    { id: 'c1',  name: '래미안 원페를라',     sido: '서울', gu: '서초구',  type: '민영', price: 6680, marketPrice: 8200, rate: 412.5, units: 465,  apply: '2026-06-09', status: '접수예정' },
    { id: 'c2',  name: '아크로 리버포레',     sido: '서울', gu: '성동구',  type: '민영', price: 5980, marketPrice: 7150, rate: 178.2, units: 320,  apply: '2026-06-11', status: '접수예정' },
    { id: 'c3',  name: '디에이치 방배',       sido: '서울', gu: '서초구',  type: '민영', price: 6420, marketPrice: 7600, rate: 256.8, units: 540,  apply: '2026-06-16', status: '접수예정' },
    { id: 'c4',  name: '힐스테이트 광교산',   sido: '경기', gu: '수원시',  type: '민영', price: 2480, marketPrice: 2710, rate: 38.4,  units: 1014, apply: '2026-06-10', status: '접수예정' },
    { id: 'c5',  name: '자이 더 빌리지',      sido: '경기', gu: '화성시',  type: '민영', price: 1980, marketPrice: 2090, rate: 12.7,  units: 1280, apply: '2026-06-04', status: '접수중' },
    { id: 'c6',  name: '푸르지오 센터파인',   sido: '인천', gu: '연수구',  type: '민영', price: 2240, marketPrice: 2380, rate: 27.9,  units: 880,  apply: '2026-06-12', status: '접수예정' },
    { id: 'c7',  name: '롯데캐슬 시그니처',   sido: '부산', gu: '해운대구',type: '민영', price: 2960, marketPrice: 3320, rate: 64.1,  units: 612,  apply: '2026-06-05', status: '접수중' },
    { id: 'c8',  name: '더샵 센텀포레',       sido: '대구', gu: '수성구',  type: '민영', price: 2180, marketPrice: 2240, rate: 8.3,   units: 740,  apply: '2026-06-18', status: '접수예정' },
    { id: 'c9',  name: '한화 포레나',         sido: '광주', gu: '북구',    type: '민영', price: 1720, marketPrice: 1780, rate: 5.6,   units: 690,  apply: '2026-06-19', status: '접수예정' },
    { id: 'c10', name: '호반써밋 그랜드',     sido: '대전', gu: '유성구',  type: '민영', price: 1880, marketPrice: 1990, rate: 22.4,  units: 560,  apply: '2026-06-23', status: '접수예정' },
    { id: 'c11', name: 'SK뷰 스카이',         sido: '울산', gu: '남구',    type: '민영', price: 1640, marketPrice: 1700, rate: 9.1,   units: 430,  apply: '2026-06-25', status: '접수예정' },
    { id: 'c12', name: '위브더제니스',        sido: '세종', gu: '세종시',  type: '국민', price: 1540, marketPrice: 1620, rate: 31.2,  units: 398,  apply: '2026-06-26', status: '접수예정' },
    { id: 'c13', name: '센트럴 푸르지오',     sido: '경기', gu: '성남시',  type: '민영', price: 3120, marketPrice: 3640, rate: 96.7,  units: 504,  apply: '2026-06-30', status: '접수예정' },
    { id: 'c14', name: '더샵 송도프라임',     sido: '인천', gu: '연수구',  type: '민영', price: 2360, marketPrice: 2520, rate: 41.8,  units: 1120, apply: '2026-07-02', status: '접수예정' },
  ];

  // ── 지역별 집계 (시도) ────────────────────────────────────────
  // tile: 타일 그리드 좌표 (col, row) — 남한 행정구역 근사 배치
  const regions = [
    { code: '서울', name: '서울', tile: [2, 1], supply: 4820,  avgRate: 188.4, projects: 38 },
    { code: '경기', name: '경기', tile: [3, 1], supply: 12640, avgRate: 41.2,  projects: 86 },
    { code: '인천', name: '인천', tile: [1, 1], supply: 5210,  avgRate: 33.6,  projects: 29 },
    { code: '강원', name: '강원', tile: [4, 0], supply: 1840,  avgRate: 6.4,   projects: 14 },
    { code: '충북', name: '충북', tile: [3, 2], supply: 2110,  avgRate: 11.8,  projects: 17 },
    { code: '세종', name: '세종', tile: [2, 2], supply: 1280,  avgRate: 28.7,  projects: 9  },
    { code: '충남', name: '충남', tile: [1, 2], supply: 3040,  avgRate: 9.2,   projects: 22 },
    { code: '대전', name: '대전', tile: [3, 3], supply: 1960,  avgRate: 24.5,  projects: 13 },
    { code: '경북', name: '경북', tile: [4, 2], supply: 2380,  avgRate: 7.1,   projects: 19 },
    { code: '전북', name: '전북', tile: [2, 3], supply: 1620,  avgRate: 5.9,   projects: 12 },
    { code: '대구', name: '대구', tile: [4, 3], supply: 2740,  avgRate: 10.4,  projects: 21 },
    { code: '울산', name: '울산', tile: [5, 3], supply: 1490,  avgRate: 13.2,  projects: 10 },
    { code: '광주', name: '광주', tile: [1, 4], supply: 1880,  avgRate: 8.7,   projects: 14 },
    { code: '전남', name: '전남', tile: [2, 4], supply: 1430,  avgRate: 4.8,   projects: 11 },
    { code: '경남', name: '경남', tile: [4, 4], supply: 2960,  avgRate: 12.6,  projects: 23 },
    { code: '부산', name: '부산', tile: [5, 4], supply: 3680,  avgRate: 47.3,  projects: 26 },
    { code: '제주', name: '제주', tile: [2, 5], supply: 720,   avgRate: 6.1,   projects: 6  },
  ];

  // ── 월별 평균 경쟁률 추이 (전국) ──────────────────────────────
  const trend = [
    { month: '11월', rate: 18.2, supply: 5210 },
    { month: '12월', rate: 22.6, supply: 6840 },
    { month: '1월',  rate: 16.4, supply: 4120 },
    { month: '2월',  rate: 24.1, supply: 5680 },
    { month: '3월',  rate: 33.8, supply: 7920 },
    { month: '4월',  rate: 29.5, supply: 8340 },
    { month: '5월',  rate: 38.7, supply: 9180 },
    { month: '6월',  rate: 44.2, supply: 9740 },
  ];

  // ── 공급 유형 구성 ────────────────────────────────────────────
  const supplyTypes = [
    { label: '민영주택',   value: 58, color: '#2563EB' },
    { label: '국민주택',   value: 22, color: '#0D9488' },
    { label: '신혼희망',   value: 11, color: '#F59E0B' },
    { label: '공공분양',   value: 9,  color: '#7C3AED' },
  ];

  // ── KPI 요약 ──────────────────────────────────────────────────
  const kpis = [
    { label: '이번 달 분양 단지', value: '127', unit: '곳',  delta: +12.4, sub: '전월 대비' },
    { label: '전국 평균 경쟁률',  value: '44.2', unit: ':1', delta: +14.2, sub: '전월 대비' },
    { label: '총 공급 세대',      value: '38,420', unit: '세대', delta: +6.8, sub: '전월 대비' },
    { label: '평균 분양가율',     value: '86.4', unit: '%',  delta: -2.1, sub: '시세 대비' },
  ];

  window.CHEONGYAK_DATA = { complexes, regions, trend, supplyTypes, kpis };
})();

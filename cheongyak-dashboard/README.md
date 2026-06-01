# 청약 인사이트 대시보드

> 한국부동산원 청약홈 공공데이터 API 기반 실시간 청약 분석 대시보드

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)
[![공공데이터](https://img.shields.io/badge/공공데이터포털-API-green)](https://data.go.kr)

---

## 📌 프로젝트 개요

공공데이터포털에서 제공하는 **한국부동산원 청약홈 API 3종**을 연동하여, 전국 APT 청약 현황을 시각화하는 웹 대시보드입니다.

- **분양 공고** 목록 조회 및 상태 확인
- **청약 경쟁률** 주택형별·거주지역별 차트 분석
- **지역별 신청·당첨 현황** 전국 타일맵 히트맵
- **청약 일정** 달력 + 상태/지역 필터 목록

---

## 🖥️ 화면 구성

### 대시보드 (메인)
- KPI 카드 4종 (분양공고 건수 · 평균경쟁률 · 총 공급세대 · 연동 API 수)
- 경쟁률 TOP 8 가로 막대 히트맵 차트
- 월별 신청 추이 영역 라인 차트
- 분양 공고 테이블 (최신 8건)
- 공급 유형 도넛 차트 + 지역별 신청 현황

### 경쟁률 분석
- 1순위 / 2순위 필터
- 주택형별 평균 경쟁률 TOP 10 차트
- 거주지역별 평균 경쟁률 차트
- 경쟁률 상세 테이블 (페이지네이션)

### 지역 현황 (GeoLayout)
- 전국 타일맵 히트맵 — 지역 클릭 시 우측 패널 업데이트
- 신청건수 / 당첨건수 지표 전환
- 선택 지역 KPI · 연령대 분포 · 지역 랭킹
- 월별 전국 신청 추이

### 청약 일정
- 이번달 달력 (접수 단지 표시)
- 상태(접수중/접수예정/마감) + 지역 필터
- 단지명 · 공급지역 · 접수일 · 당첨발표일 테이블

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS + CSS Variables (Pretendard 폰트) |
| 차트 | SVG 커스텀 차트 (HBarRank · AreaLine · Donut · Sparkline) |
| 데이터 패칭 | SWR (자동 캐싱 + 리프레시) |
| 배포 | Vercel |

---

## 📡 연동 API

모두 `https://api.odcloud.kr/api` 기반 REST API (JSON 응답)

| API명 | 엔드포인트 | 주요 데이터 |
|-------|-----------|------------|
| 분양정보 조회 | `ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail` | 단지명 · 공급지역 · 공급세대 · 접수일정 |
| 청약접수 경쟁률 | `ApplyhomeInfoCmpetRtSvc/v1/getAPTLttotPblancCmpet` | 주택형 · 경쟁률 · 접수건수 · 공급세대 |
| 특별공급 신청현황 | `ApplyhomeInfoCmpetRtSvc/v1/getAPTSpsplyReqstStus` | 특별공급 유형별 신청현황 |
| 지역별 신청자 통계 | `ApplyhomeStatSvc/v1/getAPTReqstAreaStat` | 지역 · 연령대별 신청건수 |
| 지역별 당첨자 통계 | `ApplyhomeStatSvc/v1/getAPTPrzwnerAreaStat` | 지역 · 연령대별 당첨건수 |

> API 키 발급: [공공데이터포털](https://data.go.kr) → 한국부동산원 청약홈 검색 → 활용신청

---

## 📁 프로젝트 구조

```
cheongyak-dashboard/
├── app/
│   ├── layout.tsx                      # 루트 레이아웃
│   ├── page.tsx                        # 진입점 (Dashboard 렌더)
│   ├── globals.css                     # CSS Variables + Pretendard 폰트
│   ├── api/
│   │   ├── announcements/route.ts      # 분양정보 API Route
│   │   ├── competition/route.ts        # 경쟁률 API Route
│   │   ├── applicants/route.ts         # 신청·당첨자 API Route
│   │   └── schedule/route.ts           # 청약 일정 API Route (50건)
│   └── components/
│       ├── Dashboard.tsx               # 메인 레이아웃 + 사이드바 + 페이지 라우팅
│       ├── ui.tsx                      # 공통 UI (Card · KpiCard · Logo · Chip · StatusPill 등)
│       ├── charts.tsx                  # SVG 차트 컴포넌트 (HBarRank · AreaLine · Donut)
│       └── pages/
│           ├── CompetitionPage.tsx     # 경쟁률 분석 페이지
│           ├── RegionPage.tsx          # 지역 현황 페이지 (타일맵)
│           └── SchedulePage.tsx        # 청약 일정 페이지 (달력)
├── lib/
│   └── api.ts                          # 공공API 호출 함수 (서버사이드)
├── api-guide/                          # 공공데이터포털 API 기술문서 (docx)
├── claude_design_sample/               # UI 디자인 시안 (A·B·C 3종)
├── .env.example                        # 환경변수 예시
└── .env.local                          # 실제 API 키 (Git 제외)
```

---

## 🚀 로컬 실행

### 1. 저장소 클론

```bash
git clone https://github.com/HOYUN-Y/krema_ai_edu.git
cd krema_ai_edu/cheongyak-dashboard
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일 수정:

```env
NEXT_PUBLIC_API_KEY=공공데이터포털_인증키_Decoding값
```

> ⚠️ **반드시 Decoding 키 사용** — URLSearchParams가 자동 인코딩하므로 이미 인코딩된 Encoding 키 사용 시 이중 인코딩으로 인증 실패

### 4. 개발 서버 실행

```bash
npm run dev
```

→ `http://localhost:3000` 에서 확인

---

## ☁️ Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. **Root Directory** → `cheongyak-dashboard` 설정
3. **Settings → Environment Variables** 추가:

   | 변수명 | 값 |
   |--------|-----|
   | `NEXT_PUBLIC_API_KEY` | 공공데이터포털 발급 API 키 (Decoding) |

4. Deploy → 자동 빌드 및 배포

---

## 🔒 API 키 보안

- API 키는 `.env.local`에만 저장 (`.gitignore` 적용)
- Next.js API Route를 프록시로 사용 → **클라이언트에 API 키 미노출**
- 모든 공공API 호출은 `lib/api.ts` 서버사이드 함수에서만 처리

---

## 📊 데이터 현황 (2026년 6월 기준)

| API | 총 데이터 건수 |
|-----|--------------|
| 분양정보 | 약 2,777건 |
| 경쟁률 | 약 52,904건 |
| 신청자 통계 | 약 841건 |

---

## 📝 라이선스

본 프로젝트는 학습 목적으로 제작되었습니다.
데이터 출처: [공공데이터포털](https://data.go.kr) · 한국부동산원 청약홈

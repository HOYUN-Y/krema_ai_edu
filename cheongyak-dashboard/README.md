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
- **RAG 챗봇** DB 기반 자연어 질의 (GPT-3.5 + Text-to-SQL)
- **모바일 반응형** 하단 탭바 + 2×2 KPI 그리드

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

### 데이터랩
- CSV / XLSX 다운로드 (분양정보 · 경쟁률 · 통계)
- Vercel Cron 자동 동기화 (매일 새벽 2시 KST)

### RAG 챗봇 (우측 하단 플로팅)
- OpenAI GPT-3.5 + Text-to-SQL
- Turso(libSQL) DB 직접 조회
- 빠른 질문 예시 버튼 제공

---

## 📱 모바일 반응형

768px 이하 화면에서 자동으로 모바일 레이아웃으로 전환됩니다.

| 항목 | 데스크톱 | 모바일 |
|------|---------|--------|
| 네비게이션 | 좌측 사이드바 | 하단 고정 탭바 |
| KPI 카드 | 4열 | 2×2 그리드 |
| 콘텐츠 레이아웃 | 2열 | 1열 스택 |
| 상단 헤더 | 가로 배치 | 세로 배치 |
| 일정 테이블 | 그리드 | 가로 스크롤 |
| 챗봇 팝업 | 380px 고정 | 화면 너비에 맞춤 |

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS + CSS Variables (Pretendard 폰트) |
| 차트 | ECharts (echarts-for-react) + SVG 커스텀 차트 |
| DB | Turso (libSQL / SQLite 클라우드) |
| 데이터 패칭 | SWR (자동 캐싱 + 리프레시) |
| AI | OpenAI GPT-3.5 (Text-to-SQL RAG) |
| 배포 | Vercel (ICN 리전) |

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
│   ├── layout.tsx                      # 루트 레이아웃 (ChatBot 포함)
│   ├── page.tsx                        # 진입점 (Dashboard 렌더)
│   ├── globals.css                     # CSS Variables + 반응형 미디어 쿼리
│   ├── api/
│   │   ├── announcements/route.ts      # 분양정보 API Route
│   │   ├── competition/route.ts        # 경쟁률 API Route
│   │   ├── applicants/route.ts         # 신청·당첨자 API Route
│   │   ├── schedule/route.ts           # 청약 일정 API Route
│   │   ├── export/route.ts             # CSV/XLSX 다운로드 Route
│   │   ├── chat/route.ts               # RAG 챗봇 (GPT-3.5 + Text-to-SQL)
│   │   ├── sync/route.ts               # 수동 전체 동기화
│   │   └── cron/route.ts               # Vercel Cron 자동 동기화
│   └── components/
│       ├── Dashboard.tsx               # 메인 레이아웃 + 사이드바/탭바 + 페이지 라우팅
│       ├── ChatBot.tsx                 # RAG 챗봇 플로팅 UI
│       ├── ui.tsx                      # 공통 UI (Card · KpiCard · Logo · Chip · StatusPill 등)
│       ├── charts/                     # ECharts 차트 컴포넌트
│       │   ├── BarChart.tsx
│       │   ├── LineChart.tsx
│       │   ├── DonutChart.tsx
│       │   ├── StackedBarChart.tsx
│       │   └── KoreaMap.tsx
│       └── pages/
│           ├── CompetitionPage.tsx     # 경쟁률 분석 페이지
│           ├── RegionPage.tsx          # 지역 현황 페이지 (타일맵)
│           ├── SchedulePage.tsx        # 청약 일정 페이지 (달력)
│           └── DataLabPage.tsx         # 데이터랩 (다운로드)
├── lib/
│   ├── api.ts                          # 공공API 호출 함수 (서버사이드)
│   ├── db.ts                           # Turso DB 클라이언트 + 스키마 초기화
│   └── sync.ts                         # DB-first 동기화 모듈 (TTL 캐싱)
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
# 공공데이터포털 API 키 (Decoded 인증키)
APPLYHOME_SERVICE_KEY=공공데이터포털_Decoded_API키

# Turso DB (libSQL 클라우드)
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Vercel Cron 보안 키 (openssl rand -hex 32)
CRON_SECRET=your_cron_secret_key

# OpenAI API 키 (RAG 챗봇용)
OPENAI_API_KEY=sk-...
```

> ⚠️ **주의사항**
> - `APPLYHOME_SERVICE_KEY`는 **Decoded 키** 사용 (Encoded 키 사용 시 이중 인코딩으로 인증 실패)
> - `NEXT_PUBLIC_` 접두사 절대 사용 금지 — 브라우저 번들에 키가 노출됨
> - 로컬 개발 시 `TURSO_DATABASE_URL` 미설정 시 `./local.db` SQLite 파일 자동 사용

### 4. 개발 서버 실행

```bash
npm run dev
```

→ `http://localhost:3000` 에서 확인

---

## ☁️ Vercel 배포

1. GitHub 저장소를 Vercel에 연결
2. **Root Directory** → `cheongyak-dashboard` 설정
3. **Settings → Environment Variables** 에서 아래 4개 등록:

   | 변수명 | 설명 |
   |--------|------|
   | `APPLYHOME_SERVICE_KEY` | 공공데이터포털 발급 API 키 (Decoded) |
   | `TURSO_DATABASE_URL` | Turso DB 접속 URL |
   | `TURSO_AUTH_TOKEN` | Turso DB 인증 토큰 |
   | `OPENAI_API_KEY` | OpenAI API 키 |

   > `NEXT_PUBLIC_` 접두사 없이 등록할 것

4. Deploy → 자동 빌드 및 배포

### Vercel Cron 자동 동기화

`vercel.json`에 설정된 Cron이 **매일 새벽 2시 KST(17:00 UTC)**에 `/api/cron`을 호출하여 DB를 자동 갱신합니다.

```json
{
  "crons": [{ "path": "/api/cron", "schedule": "0 17 * * *" }]
}
```

---

## 🔒 API 키 보안

- API 키는 `.env.local`에만 저장 (`.gitignore` 적용)
- `NEXT_PUBLIC_` 접두사 없이 서버 전용 환경변수로 관리
- 모든 공공API 호출은 `lib/api.ts` 서버사이드 함수에서만 처리
- DB 인증은 `TURSO_AUTH_TOKEN`으로 서버에서만 접근

---

## 🗄️ DB 구조 (Turso / libSQL)

| 테이블 | 설명 |
|--------|------|
| `apt_announcements` | 분양 공고 (house_manage_no PK) |
| `apt_competitions` | 경쟁률 데이터 |
| `reqst_area_stats` | 지역별 신청자 통계 |
| `przwner_area_stats` | 지역별 당첨자 통계 |
| `sync_log` | 동기화 이력 (TTL 캐싱 기준) |

TTL 설정: 분양정보 15분 · 경쟁률 5분 · 통계 60분

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

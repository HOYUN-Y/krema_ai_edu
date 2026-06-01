# 청약 대시보드

한국부동산원 청약홈 공공데이터 API를 활용한 청약 정보 대시보드

## 사용 API

| API | 기능 |
|-----|------|
| 분양정보 조회 서비스 | 분양 공고 목록 |
| 청약접수 경쟁률 및 특별공급 신청현황 | 타입별 경쟁률 차트 |
| 청약 신청·당첨자 정보 조회 | 당첨자 통계 |

## 로컬 실행

### 1. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 API 키 입력:

```
API_SERVICE_KEY=공공데이터포털에서_발급받은_인증키(Decoding)
```

> ⚠️ **Decoding 키** 사용 권장 (URL 인코딩 불필요)

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인

## Vercel 배포

1. GitHub에 push
2. [vercel.com](https://vercel.com) → Import Project
3. **Settings → Environment Variables** 에 추가:
   - `API_SERVICE_KEY` = 발급받은 API 키

## API 엔드포인트 조정

`lib/api.ts` 파일에서 엔드포인트 경로 수정 가능.
공공데이터포털 상세 페이지 → "활용신청 상세" → "미리보기"에서 실제 URL 확인 후 맞춰주세요.

```ts
// 분양정보
"/B551408/RTHC_BldgMngtR/getAPTLttotPblancMaster"

// 경쟁률
"/B551408/RTHC_BldgMngtR/getAPTLttotPblancDetail"

// 당첨자
"/B551408/RTHC_BldgMngtR/getAPTLttotWinnerListInfo"
```

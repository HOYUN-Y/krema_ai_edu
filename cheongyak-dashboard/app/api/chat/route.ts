import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { db, initSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DB_SCHEMA = `
청약 데이터베이스 스키마:

1. apt_announcements (분양정보)
   - house_manage_no: 주택관리번호 (PK)
   - house_nm: 단지명
   - sido: 공급지역 (서울, 경기, 인천, 부산, 대구, 대전, 광주, 울산, 세종, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)
   - house_dtl_secd: 주택구분코드 (01=민영, 03=국민)
   - house_dtl_secd_nm: 주택구분명 (민영, 국민)
   - tot_suply_hshldco: 총 공급세대수
   - rcpt_bgnde: 청약접수 시작일 (YYYY-MM-DD)
   - rcpt_endde: 청약접수 종료일 (YYYY-MM-DD)
   - przwner_de: 당첨자 발표일 (YYYY-MM-DD)

2. apt_competitions (경쟁률)
   - house_manage_no: 주택관리번호
   - house_ty: 주택형 (예: "084.9543T")
   - rank_code: 청약순위 (1 또는 2)
   - reside_senm: 거주구분 (해당지역, 기타지역, 기타경기)
   - suply_hshldco: 공급세대수
   - req_cnt: 접수건수
   - cmpet_rate: 경쟁률 (예: "401.00", "-"는 미접수)
   * cmpet_rate 숫자 변환: CAST(NULLIF(cmpet_rate, '-') AS REAL)

3. reqst_area_stats (지역별 신청자 통계)
   - stat_de: 기준연월 (YYYYMM, 예: "202601")
   - area_nm: 지역명
   - age_30, age_40, age_50, age_60: 연령대별 신청건수

4. przwner_area_stats (지역별 당첨자 통계)
   - stat_de: 기준연월 (YYYYMM)
   - area_nm: 지역명
   - age_30, age_40, age_50, age_60: 연령대별 당첨건수
`;

async function runQuery(sql: string) {
  if (!sql.trim().toUpperCase().startsWith("SELECT")) {
    return { error: "SELECT 쿼리만 허용됩니다." };
  }
  try {
    const result = await db.execute(sql);
    return {
      rowCount: result.rows.length,
      rows: result.rows.slice(0, 20),
      truncated: result.rows.length > 20,
    };
  } catch (e) {
    return { error: `쿼리 오류: ${String(e)}` };
  }
}

async function getStats() {
  const r = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM apt_announcements) as 분양공고수,
      (SELECT COUNT(*) FROM apt_competitions)  as 경쟁률데이터수,
      (SELECT COUNT(*) FROM reqst_area_stats)  as 신청자통계수,
      (SELECT COUNT(*) FROM przwner_area_stats) as 당첨자통계수,
      (SELECT MAX(stat_de) FROM reqst_area_stats) as 최신통계월,
      (SELECT COUNT(DISTINCT sido) FROM apt_announcements) as 지역수
  `);
  return r.rows[0];
}

export async function POST(req: Request) {
  const { messages } = await req.json();
  await initSchema();

  // AI SDK v5 호환: tools를 any로 캐스팅
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any = {
    queryDatabase: {
      description: "청약 DB에 SQL SELECT 쿼리를 실행합니다.",
      parameters: z.object({
        sql: z.string().describe("실행할 SELECT SQL 쿼리"),
        description: z.string().describe("이 쿼리가 조회하는 내용"),
      }),
      execute: async ({ sql }: { sql: string; description: string }) => runQuery(sql),
    },
    getDbStats: {
      description: "현재 DB에 저장된 데이터 현황을 조회합니다.",
      parameters: z.object({}),
      execute: async () => getStats(),
    },
  };

  const result = streamText({
    model: openai("gpt-3.5-turbo"),
    system: `당신은 한국 청약 시장 전문 분석 AI 어시스턴트입니다.
사용자의 질문을 이해하고, 필요하면 도구를 사용해 DB를 조회한 후 정확한 데이터를 기반으로 답변하세요.

${DB_SCHEMA}

답변 규칙:
- 항상 한국어로 답변하세요
- 데이터 수치를 정확히 인용하고 표/목록으로 정리하세요
- 데이터가 없으면 솔직하게 말하세요`,
    messages,
    tools,
  });

  return result.toTextStreamResponse();
}

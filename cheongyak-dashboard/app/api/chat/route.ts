import { db, initSchema } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DB_SCHEMA = `
청약 데이터베이스 스키마:
1. apt_announcements (분양정보): house_manage_no(PK), house_nm(단지명), sido(지역), house_dtl_secd(01=민영/03=국민), tot_suply_hshldco(공급세대), rcpt_bgnde(접수시작), rcpt_endde(접수종료), przwner_de(당첨발표)
2. apt_competitions (경쟁률): house_manage_no, house_ty(주택형), rank_code(순위1or2), reside_senm(거주구분), suply_hshldco(공급세대), req_cnt(접수건수), cmpet_rate(경쟁률, "-"=미접수, CAST(NULLIF(cmpet_rate,'-') AS REAL)로 숫자변환)
3. reqst_area_stats (신청자통계): stat_de(YYYYMM), area_nm(지역명), age_30/age_40/age_50/age_60(연령대별건수)
4. przwner_area_stats (당첨자통계): stat_de(YYYYMM), area_nm(지역명), age_30/age_40/age_50/age_60(연령대별건수)
`;

async function executeSQL(sql: string) {
  if (!sql.trim().toUpperCase().startsWith("SELECT")) {
    return { error: "SELECT 쿼리만 허용됩니다." };
  }
  try {
    const result = await db.execute(sql);
    return { rowCount: result.rows.length, rows: result.rows.slice(0, 20) };
  } catch (e) {
    return { error: String(e) };
  }
}

async function getDbStats() {
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

const OPENAI_TOOLS = [
  {
    type: "function",
    function: {
      name: "queryDatabase",
      description: "청약 DB에 SQL SELECT 쿼리를 실행합니다.",
      parameters: {
        type: "object",
        properties: {
          sql: { type: "string", description: "실행할 SELECT SQL 쿼리" },
          description: { type: "string", description: "쿼리 설명" },
        },
        required: ["sql", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getDbStats",
      description: "DB에 저장된 데이터 현황을 조회합니다.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

export async function POST(req: Request) {
  const { messages } = await req.json();
  await initSchema();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      `0:"OPENAI_API_KEY가 설정되지 않았습니다. .env.local에 추가해주세요."\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  // 1단계: tool call 여부 확인
  const firstRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `당신은 한국 청약 데이터 분석 AI입니다. 데이터가 필요하면 도구를 사용하세요.\n${DB_SCHEMA}\n항상 한국어로 답변하세요.`,
        },
        ...messages,
      ],
      tools: OPENAI_TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!firstRes.ok) {
    const err = await firstRes.text();
    return new Response(
      `0:"OpenAI API 오류: ${err.slice(0, 100)}"\n`,
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const firstData = await firstRes.json();
  const assistantMsg = firstData.choices[0].message;

  // tool call 없으면 바로 스트리밍 반환
  if (!assistantMsg.tool_calls) {
    return streamAnswer(assistantMsg.content ?? "", apiKey, messages);
  }

  // 2단계: tool 실행
  const toolResults: { role: string; tool_call_id: string; content: string }[] = [];

  for (const tc of assistantMsg.tool_calls) {
    let result;
    try {
      const args = JSON.parse(tc.function.arguments);
      if (tc.function.name === "queryDatabase") {
        result = await executeSQL(args.sql);
      } else if (tc.function.name === "getDbStats") {
        result = await getDbStats();
      } else {
        result = { error: "알 수 없는 도구" };
      }
    } catch (e) {
      result = { error: String(e) };
    }

    toolResults.push({
      role: "tool",
      tool_call_id: tc.id,
      content: JSON.stringify(result),
    });
  }

  // 3단계: tool 결과를 포함해 최종 스트리밍 답변
  const finalMessages = [
    {
      role: "system",
      content: `당신은 한국 청약 데이터 분석 AI입니다. 아래 DB 조회 결과를 바탕으로 명확하고 친절하게 한국어로 답변하세요.\n${DB_SCHEMA}`,
    },
    ...messages,
    assistantMsg,
    ...toolResults,
  ];

  return streamAnswer(null, apiKey, finalMessages);
}

async function streamAnswer(
  directText: string | null,
  apiKey: string,
  messages: object[]
) {
  // 직접 텍스트면 바로 반환
  if (directText !== null) {
    const encoded = new TextEncoder().encode(`0:${JSON.stringify(directText)}\n`);
    return new Response(encoded, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "x-vercel-ai-data-stream": "v1" },
    });
  }

  // 스트리밍 응답
  const streamRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    }),
  });

  const reader = streamRes.body?.getReader();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) { controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
          try {
            const chunk = JSON.parse(line.slice(6));
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(`0:${JSON.stringify(delta)}\n`));
            }
          } catch { /* skip */ }
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-ai-data-stream": "v1",
    },
  });
}

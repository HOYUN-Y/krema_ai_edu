"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const QUICK_QUESTIONS = [
    "현재 DB 데이터 현황 알려줘",
    "경쟁률 높은 단지 TOP 5는?",
    "서울 민영 아파트 청약 일정은?",
    "30대 신청이 가장 많은 지역은?",
    "수도권 vs 지방 공급 비교해줘",
  ];

  function sendQuestion(q: string) {
    handleInputChange({ target: { value: q } } as React.ChangeEvent<HTMLInputElement>);
    setTimeout(() => {
      (document.getElementById("chat-form") as HTMLFormElement)?.requestSubmit();
    }, 50);
  }

  return (
    <>
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 24, zIndex: 1000,
          width: 380, height: 560,
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: 18, boxShadow: "0 8px 40px rgba(15,23,42,.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* 헤더 */}
          <div style={{
            padding: "14px 18px", borderBottom: "1px solid var(--line)",
            background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
            display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>청약 AI 어시스턴트</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.7)" }}>DB 기반 RAG · GPT-3.5</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", padding: "4px 10px", fontSize: 13, fontFamily: "inherit" }}>✕</button>
          </div>

          {/* 메시지 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <BotBubble text="안녕하세요! 청약 데이터 AI입니다. 예시 질문을 눌러보세요 👇" />
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {QUICK_QUESTIONS.map(q => (
                    <button key={q} onClick={() => sendQuestion(q)} style={{
                      fontSize: 12, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                      border: "1px solid var(--line)", background: "var(--bg)",
                      color: "var(--ink)", textAlign: "left", fontFamily: "inherit",
                    }}>{q}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.role === "user"
                  ? <UserBubble text={typeof msg.content === "string" ? msg.content : ""} />
                  : <BotBubble text={typeof msg.content === "string" ? msg.content : ""} />}
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
                <div style={{ background: "var(--bg)", borderRadius: "0 10px 10px 10px", padding: "10px 14px", display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#93C5FD", animation: `bounce .8s ${i*.15}s ease-in-out infinite` }} />)}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#DC2626" }}>
                ⚠️ {String(error).includes("401") || String(error).includes("API")
                  ? "OpenAI API 키를 .env.local에 입력해주세요"
                  : String(error)}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <form id="chat-form" onSubmit={handleSubmit} style={{
            padding: "12px 14px", borderTop: "1px solid var(--line)",
            display: "flex", gap: 8, background: "var(--surface)", flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="청약 관련 질문을 입력하세요…"
              disabled={isLoading}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10,
                border: "1px solid var(--line)", fontSize: 13,
                background: isLoading ? "var(--track)" : "var(--bg)",
                color: "var(--ink)", fontFamily: "inherit", outline: "none",
              }}
            />
            <button type="submit" disabled={isLoading || !input.trim()} style={{
              padding: "9px 14px", borderRadius: 10, border: "none",
              background: isLoading || !input.trim() ? "#CBD5E1" : "#2563EB",
              color: "#fff", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: 16, transition: "background .15s",
            }}>↑</button>
          </form>
        </div>
      )}

      {/* 플로팅 버튼 */}
      <button onClick={() => setOpen(v => !v)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
        border: "none", cursor: "pointer",
        boxShadow: "0 4px 20px rgba(37,99,235,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, transition: "transform .2s",
        transform: open ? "scale(0.92)" : "scale(1)",
      }}>
        {open ? <span style={{ fontSize: 18, color: "#fff" }}>✕</span> : "🤖"}
      </button>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </>
  );
}

function BotBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>🤖</div>
      <div style={{ background: "var(--bg)", borderRadius: "0 10px 10px 10px", padding: "10px 13px", fontSize: 13, lineHeight: 1.65, color: "var(--ink)", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "85%" }}>
        {text || "…"}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div style={{ background: "#2563EB", color: "#fff", borderRadius: "10px 0 10px 10px", padding: "10px 13px", fontSize: 13, lineHeight: 1.5, maxWidth: "85%", wordBreak: "break-word" }}>
        {text}
      </div>
    </div>
  );
}

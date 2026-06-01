import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import ChatBot from "./components/ChatBot";

export const metadata: Metadata = {
  title: "청약 인사이트 대시보드",
  description: "한국부동산원 청약홈 공공데이터 기반 청약 분석 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          {children}
          <ChatBot />
        </Providers>
      </body>
    </html>
  );
}

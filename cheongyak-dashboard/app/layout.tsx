import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "청약 대시보드",
  description: "한국부동산원 청약홈 데이터 기반 청약 정보 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="bg-brand-700 text-white px-6 py-4 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">청약 대시보드</h1>
              <p className="text-brand-100 text-xs">한국부동산원 청약홈 공공데이터</p>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6 border-t mt-8">
          데이터 출처: 공공데이터포털 한국부동산원 청약홈 API
        </footer>
      </body>
    </html>
  );
}

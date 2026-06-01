import AnnouncementTable from "./components/AnnouncementTable";
import DetailPanel from "./components/DetailPanel";

export default function HomePage() {
  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "📢", label: "분양 공고", desc: "최신 APT 분양 정보" },
          { icon: "⚡", label: "청약 경쟁률", desc: "타입별 경쟁률 차트" },
          { icon: "🏆", label: "당첨자 현황", desc: "당첨자 통계 분석" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="font-semibold">{card.label}</p>
              <p className="text-xs text-gray-500">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 분양 공고 목록 */}
      <AnnouncementTable />

      {/* 단지 상세 (경쟁률 + 당첨자) */}
      <DetailPanel />
    </div>
  );
}

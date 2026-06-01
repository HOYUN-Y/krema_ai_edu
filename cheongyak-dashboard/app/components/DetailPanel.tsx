"use client";

import { useState } from "react";
import CompetitionChart from "./CompetitionChart";
import ApplicantStats from "./ApplicantStats";

export default function DetailPanel() {
  const [input, setInput] = useState("");
  const [houseManageNo, setHouseManageNo] = useState("");

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-lg mb-3">🔍 단지 상세 조회</h2>
        <p className="text-sm text-gray-500 mb-3">
          위 목록에서 단지를 선택하거나, 주택관리번호(houseManageNo)를 직접 입력하세요.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="주택관리번호 입력 (예: 2024000001)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={() => setHouseManageNo(input.trim())}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            조회
          </button>
        </div>
      </section>

      {houseManageNo && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CompetitionChart houseManageNo={houseManageNo} />
          <ApplicantStats houseManageNo={houseManageNo} />
        </div>
      )}
    </div>
  );
}

"use client";

import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

export default function AnnouncementTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useSWR(
    `/api/announcements?page=${page}`,
    fetcher
  );

  if (isLoading) return <Skeleton />;
  if (error || data?.error) return <ErrorBox msg={data?.error ?? "API 오류"} />;

  const items: Item[] = data?.items ?? [];
  const total: number = data?.totalCount ?? 0;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">📋 분양 공고 목록</h2>
        <span className="text-sm text-gray-500">총 {total.toLocaleString()}건</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {["단지명", "지역", "공급규모", "청약접수 시작일", "청약접수 종료일", "당첨자 발표일"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">데이터가 없습니다</td></tr>
            ) : items.map((item, i) => (
              <tr key={i} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-3 font-medium text-brand-700">{item.houseNm ?? "-"}</td>
                <td className="px-4 py-3">{item.sido ?? "-"} {item.gugun ?? ""}</td>
                <td className="px-4 py-3 text-right">{item.totSuplyHshldco ? Number(item.totSuplyHshldco).toLocaleString() + "세대" : "-"}</td>
                <td className="px-4 py-3">{item.rceptBgnde ?? "-"}</td>
                <td className="px-4 py-3">{item.rceptEndde ?? "-"}</td>
                <td className="px-4 py-3">{item.przwnerPresnatnDe ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t flex items-center gap-2 justify-center">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          이전
        </button>
        <span className="text-sm text-gray-600">{page}페이지</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={items.length < 20}
          className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
        >
          다음
        </button>
      </div>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-sm">
      ⚠️ {msg}
    </div>
  );
}

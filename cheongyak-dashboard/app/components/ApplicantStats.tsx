"use client";

import useSWR from "swr";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

export default function ApplicantStats() {
  const { data, isLoading, error } = useSWR("/api/applicants", fetcher);

  if (isLoading) return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;
  if (error || data?.error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
      ⚠️ {data?.error ?? "API 오류"}
    </div>
  );

  const items: Item[] = data?.items ?? [];

  // 지역별 연령대 신청 현황
  const chartData = items.slice(0, 10).map((item) => ({
    name: String(item.SUBSCRPT_AREA_CODE_NM ?? ""),
    "30대이하": Number(item.AGE_30 ?? 0),
    "40대": Number(item.AGE_40 ?? 0),
    "50대": Number(item.AGE_50 ?? 0),
    "60대이상": Number(item.AGE_60 ?? 0),
  }));

  const totalReq = items.reduce(
    (sum, item) =>
      sum + Number(item.AGE_30 ?? 0) + Number(item.AGE_40 ?? 0) +
      Number(item.AGE_50 ?? 0) + Number(item.AGE_60 ?? 0),
    0
  );

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-lg mb-2">👥 지역별 연령대 신청 현황</h2>
      <p className="text-sm text-gray-500 mb-4">
        총 신청건수: <span className="font-semibold text-gray-800">{totalReq.toLocaleString()}건</span>
      </p>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v.toLocaleString()} />
            <Legend />
            <Bar dataKey="30대이하" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="40대" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="50대" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="60대이상" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

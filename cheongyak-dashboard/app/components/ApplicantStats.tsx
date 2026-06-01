"use client";

import useSWR from "swr";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type Item = Record<string, string | number>;

export default function ApplicantStats({ houseManageNo }: { houseManageNo: string }) {
  const { data, isLoading, error } = useSWR(
    houseManageNo ? `/api/applicants?id=${houseManageNo}` : null,
    fetcher
  );

  if (!houseManageNo) return null;
  if (isLoading) return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;
  if (error || data?.error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
      ⚠️ {data?.error ?? "API 오류"}
    </div>
  );

  const items: Item[] = Array.isArray(data) ? data : [];

  const typeMap: Record<string, number> = {};
  items.forEach((item) => {
    const type = String(item.houseTyCd ?? item.houseType ?? "기타");
    typeMap[type] = (typeMap[type] ?? 0) + 1;
  });
  const pieData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  const stats = [
    { label: "총 당첨자", value: items.length.toLocaleString() + "명" },
    { label: "공급 타입 수", value: pieData.length + "종" },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-lg mb-4">🏆 당첨자 정보</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-brand-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-700">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {pieData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

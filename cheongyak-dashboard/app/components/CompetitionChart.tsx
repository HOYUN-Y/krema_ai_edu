"use client";

import useSWR from "swr";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

export default function CompetitionChart() {
  const { data, isLoading, error } = useSWR("/api/competition", fetcher);

  if (isLoading) return <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />;
  if (error || data?.error) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
      ⚠️ {data?.error ?? "API 오류"}
    </div>
  );

  const items: Item[] = data?.competition?.items ?? [];

  // 주택형별로 그룹화
  const grouped: Record<string, { supply: number; req: number; rate: number }> = {};
  items.forEach((item) => {
    const key = String(item.HOUSE_TY ?? "기타");
    if (!grouped[key]) grouped[key] = { supply: 0, req: 0, rate: 0 };
    grouped[key].supply += Number(item.SUPLY_HSHLDCO ?? 0);
    grouped[key].req += Number(item.REQ_CNT ?? 0);
    grouped[key].rate = Math.max(grouped[key].rate, Number(item.CMPET_RATE ?? 0));
  });

  const chartData = Object.entries(grouped).slice(0, 10).map(([name, v]) => ({
    name,
    공급세대수: v.supply,
    접수건수: v.req,
    경쟁률: v.rate,
  }));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-lg mb-4">📊 주택형별 경쟁률</h2>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, name: string) =>
                name === "경쟁률" ? [`${v}:1`, name] : [v.toLocaleString(), name]
              }
            />
            <Legend />
            <Bar dataKey="공급세대수" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="접수건수" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="경쟁률" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

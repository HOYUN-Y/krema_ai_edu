"use client";

import useSWR from "swr";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Item = Record<string, string | number>;

export default function CompetitionChart({ houseManageNo }: { houseManageNo: string }) {
  const { data, isLoading, error } = useSWR(
    houseManageNo ? `/api/competition?id=${houseManageNo}` : null,
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
  const chartData = items.map((item) => ({
    name: String(item.houseTyCd ?? item.houseType ?? "").replace("㎡", "m²"),
    일반공급: Number(item.gnrlRnk1CrspaArea ?? 0),
    특별공급: Number(item.spsplyHshldco ?? 0),
    경쟁률: Number(item.cmprtRate ?? 0),
  }));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="font-semibold text-lg mb-4">📊 타입별 경쟁률 현황</h2>
      {chartData.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, name: string) =>
                name === "경쟁률" ? [`${v}:1`, name] : [v.toLocaleString() + "세대", name]
              }
            />
            <Legend />
            <Bar dataKey="일반공급" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="특별공급" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar dataKey="경쟁률" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

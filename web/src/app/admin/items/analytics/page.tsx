

'use client';
import { useEffect, useState } from "react";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AnalyticsTest() {
  const [data, setData] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : "";
        // 日次集計
        const res = await fetch(`${API_URL}/items-history/analytics?months=3`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("集計データ取得に失敗しました");
        const json = await res.json();
        setData(json.data || []);
        // アイテム一覧
        const res2 = await fetch(`${API_URL}/items`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res2.ok) throw new Error("アイテム一覧取得に失敗しました");
        const json2 = await res2.json();
        setItems(json2.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "不明なエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- データ整形 ---
  // 1. 日付リスト（3ヶ月分すべての日）
  const dateSet = new Set<string>();
  const today = dayjs();
  const from = today.subtract(3, "month").startOf("month");
  for (let d = from; d.isBefore(today.add(1, "day")); d = d.add(1, "day")) {
    dateSet.add(d.format("YYYY-MM-DD"));
  }
  const allDates = Array.from(dateSet).sort();

  // 2. アイテムID・名称マップ
  const itemIdNameMap: Record<string, string> = {};
  items.forEach((item: any) => {
    itemIdNameMap[String(item.id)] = item.name;
  });
  const itemIds = items.map((item: any) => String(item.id));

  // 3. 日付×アイテムで「データがない日はnull」
  const byDate: Record<string, any> = {};
  allDates.forEach((date) => {
    byDate[date] = { date };
    itemIds.forEach((id: any) => {
      byDate[date][`item_${id}`] = null;
    });
  });
  data.forEach((row: any) => {
    const idStr = String(row.item_id);
    if (byDate[row.date] && byDate[row.date][`item_${idStr}`] !== undefined) {
      byDate[row.date][`item_${idStr}`] = row.total_change;
    }
  });
  const chartData = Object.values(byDate);

  // 4. Y軸最小・最大値計算（全データの最小・最大値を切り上げ/切り下げ）
  const allValues = chartData.flatMap((row: any) => itemIds.map((id: any) => row[`item_${id}`]));
  const maxY = Math.max(0, ...allValues, 10);
  const minY = Math.min(0, ...allValues);

  return (
    <div style={{ padding: 24 }}>
      <h1>在庫増減グラフ（日次・過去3ヶ月）</h1>
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              allowDuplicatedCategory={false}
              tickFormatter={(v: string, idx: number) => {
                return idx % 7 === 0 ? dayjs(v).format("MM/DD") : "";
              }}
            />
            <YAxis domain={[minY - 10, maxY + 10]} allowDataOverflow={true} />
            <Tooltip formatter={(_v, key) => {
              let id = "";
              if (typeof key === "string" && key.startsWith("item_")) {
                id = key.replace("item_", "");
              }
              return [_v, itemIdNameMap[id] || key];
            }} labelFormatter={(v) => dayjs(v).format("YYYY-MM-DD")}/>
            <Legend formatter={(_v, entry) => {
              let id = "";
              if (entry && typeof entry.dataKey === "string" && entry.dataKey.startsWith("item_")) {
                id = entry.dataKey.replace("item_", "");
              }
              return itemIdNameMap[id] || (entry && entry.dataKey ? String(entry.dataKey) : "");
            }} />
            {itemIds.map((id: any, idx: any) => (
              <Line
                key={id}
                type="monotone"
                dataKey={`item_${id}`}
                stroke={['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a0d911', '#1890ff'][idx % 6]}
                name={itemIdNameMap[id] || `アイテムID:${id}`}
                dot={false}
                strokeWidth={2}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

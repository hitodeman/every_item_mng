"use client";

import { useEffect, useState } from "react";

type OperationLog = {
  id: number;
  user_id: string;
  username: string;
  role: string;
  operation: string;
  target_type: string;
  target_id: string | null;
  detail: string | null;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError("");
      try {
  const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${API_URL}/operation-logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("ログ取得に失敗しました");
        const json = await res.json();
        setLogs(json.data || []);
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("不明なエラーが発生しました");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleDownloadCSV = async () => {
    try {
  const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_URL}/operation-logs/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("CSVエクスポートに失敗しました");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "operation_logs.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      if (e instanceof Error) {
        alert(e.message);
      } else {
        alert("不明なエラーが発生しました");
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>操作ログ一覧</h1>
      <button onClick={handleDownloadCSV} style={{ marginBottom: 16 }}>CSVダウンロード</button>
      {loading ? (
        <p>読み込み中...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table border={1} cellPadding={4} style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>ユーザーID</th>
                <th>ユーザー名</th>
                <th>ロール</th>
                <th>操作</th>
                <th>対象種別</th>
                <th>対象ID</th>
                <th>詳細</th>
                <th>日時</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: OperationLog) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.user_id}</td>
                  <td>{log.username}</td>
                  <td>{log.role}</td>
                  <td>{log.operation}</td>
                  <td>{log.target_type}</td>
                  <td>{log.target_id}</td>
                  <td style={{ maxWidth: 300, wordBreak: "break-all" }}>{log.detail}</td>
                  <td>{log.created_at && new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

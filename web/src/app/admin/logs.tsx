
"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";
import { Badge } from "./Badge";

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

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin": return "default";
    case "branch_admin": return "secondary";
    case "user": return "outline";
    default: return "outline";
  }
};
const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin": return "管理者";
    case "branch_admin": return "支店管理者";
    case "user": return "ユーザー";
    default: return role;
  }
};
const getOperationLabel = (operation: string) => {
  switch (operation) {
    case "login": return "ログイン";
    case "stock_change": return "在庫変更";
    default: return operation;
  }
};

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError("");
      try {
  const res = await fetchWithAuth(`${API_URL}/operation-logs?limit=100`);
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
  const res = await fetchWithAuth(`${API_URL}/operation-logs/export`);
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
    <Card className="w-full" style={{ margin: 24 }}>
      <CardHeader>
        <CardTitle>操作ログ一覧</CardTitle>
        <button
          onClick={handleDownloadCSV}
          style={{ marginTop: 8, marginBottom: 8, padding: "6px 16px", borderRadius: 6, background: "var(--primary)", color: "#fff", border: "none", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
        >
          CSVダウンロード
        </button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>読み込み中...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <div className="rounded-md border" style={{ overflowX: "auto" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>ユーザーID</TableHead>
                  <TableHead>ユーザー名</TableHead>
                  <TableHead>ロール</TableHead>
                  <TableHead>操作</TableHead>
                  <TableHead>対象種別</TableHead>
                  <TableHead>対象ID</TableHead>
                  <TableHead>詳細</TableHead>
                  <TableHead>日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell className="font-mono max-w-32 truncate">
                      <span title={log.user_id}>{log.user_id}</span>
                    </TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(log.role)}>
                        {getRoleLabel(log.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getOperationLabel(log.operation)}</TableCell>
                    <TableCell>{log.target_type}</TableCell>
                    <TableCell>{log.target_id}</TableCell>
                    <TableCell className="max-w-48 truncate">
                      <span title={log.detail || undefined || ""}>{log.detail}</span>
                    </TableCell>
                    <TableCell className="font-mono whitespace-nowrap">
                      {log.created_at && new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

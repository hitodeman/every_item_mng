"use client";
import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function UserItems() {
  const [branchId, setBranchId] = useState("");
  // 追加フォーム用state
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  // user権限以外は即エラー表示
  const [roleError, setRoleError] = useState("");
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    try {
      const payload = JSON.parse(atob(raw.split('.')[1]));
      if (payload?.role !== "user") {
        setRoleError("一般ユーザーのみアクセス可能です");
      }
    } catch {}
  }, []);
  const [items, setItems] = useState([]);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [stockEditId, setStockEditId] = useState<number | null>(null);
  const [stockChange, setStockChange] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockAlert, setStockAlert] = useState<string>("");
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // JWTデコード
  function parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      setToken(raw);
      const payload = parseJwt(raw);
      setUserId(payload?.id ?? null);
      // プロファイルからbranch_id取得
      fetch(`${API_URL}/profiles`, {
        headers: { Authorization: `Bearer ${raw}` },
      })
        .then(res => res.json())
        .then(res => {
          if (res.data && res.data.length > 0) setBranchId(res.data[0].branch_id || "");
        });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(res => setItems(res.data || []));
  }, [token]);

  // user権限以外はアクセス不可
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const payload = parseJwt(raw);
    if (payload?.role !== "user") {
      setError("一般ユーザーのみアクセス可能です");
    }
  }, []);

  if (roleError) {
    return <div style={{ color: 'red', margin: '2rem' }}>{roleError}</div>;
  }
  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <h2>在庫アイテム管理（一般ユーザー）</h2>
      {/* 追加フォーム */}
      <form onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        if (!name || !unit || !price || !stock || !threshold) {
          setError("全項目必須です");
          return;
        }
        if (!/^[0-9]{1,4}$/.test(price)) {
          setError("金額は0〜9999の半角数字で入力してください");
          return;
        }
        if (!Number.isInteger(Number(stock))) {
          setError("在庫数は整数で入力してください");
          return;
        }
        if (!Number.isInteger(Number(threshold))) {
          setError("閾値は整数で入力してください");
          return;
        }
        const res = await fetch(`${API_URL}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            name,
            unit,
            price: Number(price),
            stock: Number(stock),
            threshold: Number(threshold),
            user_id: userId,
            branch_id: branchId,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "追加失敗");
        } else {
          setName(""); setUnit(""); setPrice(""); setStock(""); setThreshold("");
          setError("");
          // 再取得
          fetch(`${API_URL}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(res => setItems(res.data || []));
        }
      }} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center' }}>
        <input placeholder="名称" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="単位" value={unit} onChange={e => setUnit(e.target.value)} />
        <input placeholder="金額" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input placeholder="在庫数" type="number" value={stock} onChange={e => setStock(e.target.value)} />
        <input placeholder="閾値" type="number" value={threshold} onChange={e => setThreshold(e.target.value)} />
        <button type="submit">追加</button>
      </form>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {stockAlert && <div style={{ color: 'orange', fontWeight: 'bold', marginBottom: 8 }}>{stockAlert}</div>}
      <table border={1} cellPadding={6} style={{ width: "100%", marginBottom: 24 }}>
        <thead>
          <tr>
            <th>名称</th><th>単位</th><th>金額</th><th>在庫数</th><th>閾値</th><th>在庫数増減</th><th>履歴</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.unit}</td>
              <td>{item.price}</td>
              <td>{item.stock}</td>
              <td>{item.threshold}</td>
              <td>
                {stockEditId === item.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="number" placeholder="増減数(例:+5,-3)" value={stockChange} onChange={e => setStockChange(e.target.value)} style={{ width: 80 }} />
                    <input type="text" placeholder="理由(任意)" value={stockReason} onChange={e => setStockReason(e.target.value)} style={{ width: 120 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={async () => {
                        setError("");
                        const n = Number(stockChange);
                        if (!Number.isInteger(n) || n === 0) { setError("増減数は非ゼロの整数で"); return; }
                        const res = await fetch(`${API_URL}/items/${item.id}/stock`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ change: n, reason: stockReason })
                        });
                        const data = await res.json();
                        if (!res.ok) setError(data.error || "在庫増減失敗");
                        else {
                          if (data.alert) {
                            setStockAlert(data.alert_message || "在庫数が閾値を下回りました");
                          } else {
                            setStockAlert("");
                          }
                          setStockEditId(null); setStockChange(""); setStockReason("");
                        }
                      }}>確定</button>
                      <button onClick={() => { setStockEditId(null); setStockChange(""); setStockReason(""); }}>キャンセル</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setStockEditId(item.id); setStockChange(""); setStockReason(""); }}>在庫数増減</button>
                )}
              </td>
              <td>
                <button onClick={async () => {
                  setHistoryId(item.id); setHistoryLoading(true); setHistory([]);
                  const res = await fetch(`${API_URL}/items/${item.id}/history`, { headers: { Authorization: `Bearer ${token}` } });
                  const data = await res.json();
                  setHistory(data.data || []); setHistoryLoading(false);
                }}>履歴</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {historyId && (
        <div style={{ marginBottom: 24 }}>
          <h4>履歴（最新10件）</h4>
          {historyLoading ? <div>読込中...</div> : (
            <table border={1} cellPadding={4} style={{ width: "100%" }}>
              <thead>
                <tr><th>日時</th><th>増減</th><th>前在庫</th><th>後在庫</th><th>理由</th></tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((h: any, i: number) => (
                  <tr key={i}>
                    <td>{h.created_at}</td>
                    <td>{h.change}</td>
                    <td>{h.before_stock}</td>
                    <td>{h.after_stock}</td>
                    <td>{h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

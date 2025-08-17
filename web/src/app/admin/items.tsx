"use client";
import React, { useEffect, useState } from "react";
// JWTデコード用
function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Item = {
  id: number;
  name: string;
  unit: string;
  price: number;
  stock: number;
  threshold: number;
  user_id?: string;
};

export default function ItemsAdmin() {
  const [branchId, setBranchId] = useState("");
  // ロールチェック: admin以外はアクセス不可
  const [roleError, setRoleError] = useState("");
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    try {
      const payload = JSON.parse(atob(raw.split('.')[1]));
      if (payload?.role !== "admin" && payload?.role !== "branch_admin") {
        setRoleError("管理者または支店管理者のみアクセス可能です");
      }
    } catch {}
  }, []);
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editThreshold, setEditThreshold] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [editUserId, setEditUserId] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  // 在庫増減用
  const [stockEditId, setStockEditId] = useState<number | null>(null);
  const [stockChange, setStockChange] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockAlert, setStockAlert] = useState<string>("");
  // 履歴表示用
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    } else {
      localStorage.removeItem("jwt_token");
      setToken("");
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setItems(res.data || []));
  }, [token, success]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !unit || !price || !stock || !threshold || !userIdInput) {
      setError("全項目必須です（user_idも必須）");
      return;
    }
    // 金額バリデーション
    const pricePattern = /^[0-9]{1,4}$/;
    if (!pricePattern.test(price) || Number(price) < 0 || Number(price) > 9999) {
      setError("金額は0〜9999の半角数字で入力してください");
      return;
    }
    // 単位バリデーション
    if (!unit.trim()) {
      setError("単位を入力してください");
      return;
    }
    if (unit.length < 1 || unit.length > 5) {
      setError("単位は1〜5文字で入力してください");
      return;
    }
    const res = await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        unit,
        price: Number(price),
        stock: Number(stock),
        threshold: Number(threshold),
        user_id: userIdInput,
        branch_id: branchId,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "追加失敗");
    } else {
      setSuccess("追加成功");
      setName(""); setUnit(""); setPrice(""); setStock(""); setThreshold("");
    }
  };

  const handleEdit = (item: Item) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditUnit(item.unit);
    setEditPrice(String(item.price));
    setEditStock(String(item.stock));
    setEditThreshold(String(item.threshold));
    setEditUserId(item.user_id || "");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!editName || !editUnit || !editPrice || !editStock || !editThreshold) {
      setError("全項目必須です");
      return;
    }
    // 金額バリデーション
    const pricePattern = /^[0-9]{1,4}$/;
    if (!pricePattern.test(editPrice) || Number(editPrice) < 0 || Number(editPrice) > 9999) {
      setError("金額は0〜9999の半角数字で入力してください");
      return;
    }
    // 単位バリデーション
    if (!editUnit.trim()) {
      setError("単位を入力してください");
      return;
    }
    if (editUnit.length < 1 || editUnit.length > 5) {
      setError("単位は1〜5文字で入力してください");
      return;
    }
    const res = await fetch(`${API_URL}/items/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: editName,
        unit: editUnit,
        price: Number(editPrice),
        stock: Number(editStock),
        threshold: Number(editThreshold),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "更新失敗");
    } else {
      setSuccess("更新成功");
      setEditId(null);
    }
  if (data.alert) setStockAlert(data.alert_message || "在庫数が閾値を下回りました");
  else setStockAlert("");
  };

  const handleDelete = async (id: number) => {
    setError("");
    setSuccess("");
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "削除失敗");
    } else {
      setSuccess("削除成功");
    }
  };

  if (roleError) {
    return <div style={{ color: 'red', margin: '2rem' }}>{roleError}</div>;
  }
  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <h2>在庫アイテム管理</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
      <form onSubmit={editId ? handleUpdate : handleAdd} style={{ marginBottom: 24 }}>
    {stockAlert && <div style={{ color: 'orange', fontWeight: 'bold', marginBottom: 8 }}>{stockAlert}</div>}
        <input placeholder="名称" value={editId ? editName : name} onChange={e => editId ? setEditName(e.target.value) : setName(e.target.value)} />
        <input placeholder="単位" value={editId ? editUnit : unit} onChange={e => editId ? setEditUnit(e.target.value) : setUnit(e.target.value)} />
        <input placeholder="金額" type="number" value={editId ? editPrice : price} onChange={e => editId ? setEditPrice(e.target.value) : setPrice(e.target.value)} />
        <input placeholder="在庫数" type="number" value={editId ? editStock : stock} onChange={e => editId ? setEditStock(e.target.value) : setStock(e.target.value)} />
        <input placeholder="閾値" type="number" value={editId ? editThreshold : threshold} onChange={e => editId ? setEditThreshold(e.target.value) : setThreshold(e.target.value)} />
        <input placeholder="user_id (uuid)" value={editId ? editUserId : userIdInput} onChange={e => editId ? setEditUserId(e.target.value) : setUserIdInput(e.target.value)} />
        <button type="submit">{editId ? "更新" : "追加"}</button>
        {editId && <button type="button" onClick={() => setEditId(null)}>キャンセル</button>}
      </form>
      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th><th>名称</th><th>単位</th><th>金額</th><th>在庫数</th><th>閾値</th><th>操作</th><th>在庫数増減</th><th>履歴</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: Item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.unit}</td>
              <td>{item.price}</td>
              <td>{item.stock}</td>
              <td>{item.threshold}</td>
              <td>
                <button onClick={() => handleEdit(item)}>編集</button>
                <button onClick={() => handleDelete(item.id)}>削除</button>
              </td>
              <td>
                {stockEditId === item.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input type="number" placeholder="増減数(例:+5,-3)" value={stockChange} onChange={e => setStockChange(e.target.value)} style={{ width: 80 }} />
                    <input type="text" placeholder="理由(任意)" value={stockReason} onChange={e => setStockReason(e.target.value)} style={{ width: 120 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={async () => {
                        setError(""); setSuccess("");
                        const n = Number(stockChange);
                        if (!Number.isInteger(n) || n === 0) { setError("増減数は非ゼロの整数で"); return; }
                        const res = await fetch(`${API_URL}/items/${item.id}/stock`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ change: n, reason: stockReason })
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          setError(data.error || "在庫増減失敗");
                          setStockAlert("");
                        } else {
                          if (data.alert) {
                            setStockAlert(data.alert_message || "在庫数が閾値を下回りました");
                            setSuccess(""); // 成功メッセージは消す
                          } else {
                            setStockAlert("");
                            setSuccess("在庫増減成功");
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
      {/* 履歴モーダル */}
      {historyId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setHistoryId(null)}>
          <div style={{ background: '#fff', padding: 24, minWidth: 400, maxHeight: 500, overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>在庫増減履歴 (item_id: {historyId})</h3>
            {historyLoading ? <div>読込中...</div> : (
              <table border={1} cellPadding={4} style={{ width: '100%' }}>
                <thead>
                  <tr><th>日時</th><th>増減</th><th>前</th><th>後</th><th>理由</th><th>user_id</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan={6}>履歴なし</td></tr> : history.map(h => (
                    <tr key={h.id}>
                      <td>{h.created_at?.replace('T', ' ').slice(0, 19)}</td>
                      <td>{h.change > 0 ? `+${h.change}` : h.change}</td>
                      <td>{h.before_stock}</td>
                      <td>{h.after_stock}</td>
                      <td>{h.reason || ''}</td>
                      <td>{h.user_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button onClick={() => setHistoryId(null)} style={{ marginTop: 12 }}>閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

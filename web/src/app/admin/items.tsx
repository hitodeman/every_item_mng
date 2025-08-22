"use client";
import React, { useEffect, useState } from "react";
import { EditIcon, TrashIcon } from "./CustomIcons";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";
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
  const [token, setToken] = useState("");
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
  // userIdInput, editUserIdは不要
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
  const [historyName, setHistoryName] = useState("");
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
    if (!name || !unit || !price || !stock || !threshold) {
      setError("全項目必須です");
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
        user_id: userId, // ログインユーザーIDを利用
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
  // setEditUserId不要
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
        user_id: userId, // ログインユーザーIDを利用
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
    return <div className="danger center mt-2">{roleError}</div>;
  }
  return (
    <div className="card" style={{ maxWidth: 1200, margin: "2rem auto", padding: 24 }}>
      <h2 style={{ marginBottom: '1.5rem' }}>在庫アイテム管理</h2>
      {error && <div className="danger mb-2">{error}</div>}
      {success && <div className="mb-2" style={{ color: '#16a34a' }}>{success}</div>}
      <form onSubmit={editId ? handleUpdate : handleAdd} className="flex mb-2" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {stockAlert && <div className="mb-2" style={{ color: '#f59e42', fontWeight: 'bold', width: '100%' }}>{stockAlert}</div>}
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <div style={{ flex: '1 1 120px', display: 'flex', flexDirection: 'column' }}>
            {editId && <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>名称</label>}
            <input placeholder="名称" value={editId ? editName : name} onChange={e => editId ? setEditName(e.target.value) : setName(e.target.value)} style={{ color: '#222', background: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column' }}>
            {editId && <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>単位</label>}
            <input placeholder="単位" value={editId ? editUnit : unit} onChange={e => editId ? setEditUnit(e.target.value) : setUnit(e.target.value)} style={{ color: '#222', background: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column' }}>
            {editId && <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>金額</label>}
            <input placeholder="金額" type="number" value={editId ? editPrice : price} onChange={e => editId ? setEditPrice(e.target.value) : setPrice(e.target.value)} style={{ color: '#222', background: '#fff' }} />
          </div>
          <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column' }}>
            {editId && <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>在庫数</label>}
            <input
              placeholder="在庫数"
              type="number"
              value={editId ? editStock : stock}
              onChange={e => editId ? setEditStock(e.target.value) : setStock(e.target.value)}
              style={{ color: '#222', background: '#fff' }}
              disabled={!!editId}
            />
          </div>
          <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column' }}>
            {editId && <label style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>閾値</label>}
            <input placeholder="閾値" type="number" value={editId ? editThreshold : threshold} onChange={e => editId ? setEditThreshold(e.target.value) : setThreshold(e.target.value)} style={{ color: '#222', background: '#fff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <button type="submit" style={{ minWidth: 80 }}>{editId ? "更新" : "追加"}</button>
          </div>
          {editId && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditId(null)} style={{ minWidth: 80, background: '#e5e7eb', color: '#222' }}>キャンセル</button>
            </div>
          )}
        </div>
      </form>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead className="min-w-[150px] w-[170px] max-w-[250px]">名称</TableHead>
              <TableHead className="min-w-[30px] w-[30px] max-w-[30px]">単位</TableHead>
              <TableHead>金額</TableHead>
              <TableHead className="min-w-[200px] w-[200px] max-w-[200px]">在庫数</TableHead>
              <TableHead className="min-w-[30px] w-[30px] max-w-[30px]">閾値</TableHead>
              <TableHead>操作</TableHead>
              <TableHead className="min-w-[150px] w-[150px] max-w-[150px]">在庫数変更</TableHead>
              <TableHead className="min-w-[100px] w-[100px] max-w-[100px]">履歴</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: Item) => {
              const priceStr = `¥${item.price.toLocaleString()}`;
              const isLow = item.stock <= item.threshold;
              const badgeStyle = isLow
                ? { background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', fontWeight: 500, marginLeft: 8 }
                : { background: '#f1f5f9', color: '#334155', borderRadius: '6px', fontSize: '12px', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', fontWeight: 500, marginLeft: 8 };
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell style={{ minWidth: 100, width: 100, maxWidth: 120 }}>{item.unit}</TableCell>
                  <TableCell>{priceStr}</TableCell>
                  <TableCell style={{ minWidth: 120, width: 120, maxWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.stock != null ? item.stock.toLocaleString() : "-"}
                      <span style={badgeStyle}>
                        {isLow ? (
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{marginRight:4}}><path d="M10 15V5M10 5L6 9M10 5l4 4" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{marginRight:4}}><path d="M10 5v10m0 0l4-4m-4 4l-4-4" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        )}
                        {isLow ? '不足' : '充分'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell style={{ minWidth: 100, width: 100, maxWidth: 120 }}>{item.threshold}</TableCell>
                  <TableCell className="flex" style={{ minWidth: 50, gap: 4 }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{
                        background: '#f1f5f9',
                        color: '#334155',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        boxShadow: 'none',
                        cursor: 'pointer',
                      }}
                      aria-label="編集"
                    >
                      <EditIcon style={{ width: 22, height: 22, color: '#334155', display: 'block' }} />
                    </button>
                  </TableCell>
                  <TableCell>
                    {stockEditId === item.id ? (
                      <div className="flex" style={{ flexDirection: 'column', gap: 4 }}>
                        <input type="number" placeholder="増減数(例:+5,-3)" value={stockChange} onChange={e => setStockChange(e.target.value)} style={{ width: 80, color: '#222', background: '#fff' }} />
                        <input type="text" placeholder="理由(任意)" value={stockReason} onChange={e => setStockReason(e.target.value)} style={{ width: 120, color: '#222', background: '#fff' }} />
                        <div className="flex" style={{ gap: 4 }}>
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
                                setSuccess("");
                              } else {
                                setStockAlert("");
                                setSuccess("在庫増減成功");
                              }
                              setStockEditId(null); setStockChange(""); setStockReason("");
                            }
                          }}>確定</button>
                          <button onClick={() => { setStockEditId(null); setStockChange(""); setStockReason(""); }} style={{ background: '#e5e7eb', color: '#222' }}>キャンセル</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setStockEditId(item.id); setStockChange(""); setStockReason(""); }} style={{ background: '#fff', color: '#222', border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 90, height: 36, fontWeight: 500, cursor: 'pointer' }}>＋ / ー</button>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={async () => {
                        setHistoryId(item.id); setHistoryName(item.name);setHistoryLoading(true); setHistory([]);
                        const res = await fetch(`${API_URL}/items/${item.id}/history`, { headers: { Authorization: `Bearer ${token}` } });
                        const data = await res.json();
                        setHistory(data.data || []); setHistoryLoading(false);
                      }}
                      style={{ background: '#fff', color: '#222', border: '1px solid #e5e7eb', borderRadius: 8, minWidth: 60, height: 36, fontWeight: 500, cursor: 'pointer' }}
                    >
                      履歴
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* 履歴モーダル */}
      {historyId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setHistoryId(null)}>
          <div className="card" style={{ background: '#fff', minWidth: 400, maxHeight: 500, overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>在庫増減履歴 (名称: {historyName})</h3>
            {historyLoading ? <div>読込中...</div> : (
              <table>
                <thead>
                  <tr><th>日時</th><th>増減</th><th>前</th><th>後</th><th>理由</th><th>ユーザー</th></tr>
                </thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan={6}>履歴なし</td></tr> : history.map(h => {
                    return (
                      <tr key={h.id}>
                        <td>{h.created_at && new Date(h.created_at).toLocaleString()}</td>
                        <td>{h.change > 0 ? `+${h.change}` : h.change}</td>
                        <td>{h.before_stock}</td>
                        <td>{h.after_stock}</td>
                        <td>{h.reason || ''}</td>
                        <td>{h.user_name ?? h.user_id}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <button onClick={() => setHistoryId(null)} className="mt-2">閉じる</button>
          </div>
        </div>
      )}
    </div>
  );
}

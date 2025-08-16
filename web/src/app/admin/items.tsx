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

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      setToken(raw);
      const payload = parseJwt(raw);
      setUserId(payload?.id ?? null);
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

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <h2>在庫アイテム管理</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
      <form onSubmit={editId ? handleUpdate : handleAdd} style={{ marginBottom: 24 }}>
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
            <th>ID</th><th>名称</th><th>単位</th><th>金額</th><th>在庫数</th><th>閾値</th><th>操作</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

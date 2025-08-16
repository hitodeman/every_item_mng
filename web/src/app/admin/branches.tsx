"use client";
import { useEffect, useState } from "react";

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function BranchesAdmin() {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [token, setToken] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [roleError, setRoleError] = useState("");

  // 認証トークンはlocalStorageから取得（仮実装）
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    // JWT形式チェック
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      setToken(raw);
      const payload = parseJwt(raw);
      if (payload?.role !== "admin") {
        setRoleError("管理者のみアクセス可能です");
      }
    } else {
      localStorage.removeItem("jwt_token");
      setToken("");
    }
  }, []);

  // 一覧取得
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  }, [token]);

  // 追加
  const handleAdd = async () => {
    if (!name) return;
    await fetch(`${API_URL}/branches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, address }),
    });
    setName("");
    setAddress("");
    // 再取得
    fetch(`${API_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  };

  // 編集開始
  const startEdit = (branch: any) => {
    setEditId(branch.id);
    setEditName(branch.name);
    setEditAddress(branch.address);
  };

  // 編集保存
  const handleEdit = async () => {
    if (!editId) return;
    await fetch(`${API_URL}/branches/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editName, address: editAddress }),
    });
    setEditId(null);
    setEditName("");
    setEditAddress("");
    fetch(`${API_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  };

  // 論理削除
  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/branches/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetch(`${API_URL}/branches`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  };

  if (roleError) {
    return <div style={{ color: 'red', margin: '2rem' }}>{roleError}</div>;
  }
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>支店管理</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="支店名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="住所"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button onClick={handleAdd}>追加</button>
      </div>
      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>支店名</th>
            <th>住所</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b: any) =>
            editId === b.id ? (
              <tr key={b.id}>
                <td>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </td>
                <td>
                  <input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={handleEdit}>保存</button>
                  <button onClick={() => setEditId(null)}>キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.address}</td>
                <td>
                  <button onClick={() => startEdit(b)}>編集</button>
                  <button onClick={() => handleDelete(b.id)}>削除</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

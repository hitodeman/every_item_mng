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

export default function ProfilesAdmin() {
  const [profiles, setProfiles] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [branchId, setBranchId] = useState("");
  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editBranchId, setEditBranchId] = useState("");
  const [roleError, setRoleError] = useState("");

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

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setProfiles(res.data || []));
  }, [token]);

  // 追加
  const handleAdd = async () => {
    if (!userId || !name) return;
    await fetch(`${API_URL}/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id: userId, name, role, branch_id: branchId }),
    });
    setUserId("");
    setName("");
    setRole("user");
    setBranchId("");
    fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setProfiles(res.data || []));
  };

  // 編集開始
  const startEdit = (profile: any) => {
    setEditId(profile.id);
    setEditName(profile.name);
    setEditRole(profile.role);
    setEditBranchId(profile.branch_id);
  };

  // 編集保存
  const handleEdit = async () => {
    if (!editId) return;
    await fetch(`${API_URL}/profiles/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: editName, role: editRole, branch_id: editBranchId }),
    });
    setEditId(null);
    setEditName("");
    setEditRole("user");
    setEditBranchId("");
    fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setProfiles(res.data || []));
  };

  // 削除
  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/profiles/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((res) => setProfiles(res.data || []));
  };

  if (roleError) {
    return <div style={{ color: 'red', margin: '2rem' }}>{roleError}</div>;
  }
  return (
    <div style={{ maxWidth: 700, margin: "2rem auto" }}>
      <h2>ユーザー管理</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          placeholder="ユーザーID (auth.users.id)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          placeholder="氏名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <input
          placeholder="支店ID"
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
        />
        <button onClick={handleAdd}>追加</button>
      </div>
      <table border={1} cellPadding={8} style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>ユーザーID</th>
            <th>氏名</th>
            <th>ロール</th>
            <th>支店ID</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p: any) =>
            editId === p.id ? (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </td>
                <td>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <input
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={handleEdit}>保存</button>
                  <button onClick={() => setEditId(null)}>キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.role}</td>
                <td>{p.branch_id}</td>
                <td>
                  <button onClick={() => startEdit(p)}>編集</button>
                  <button onClick={() => handleDelete(p.id)}>削除</button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

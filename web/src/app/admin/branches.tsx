"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { Plus, Search } from "lucide-react";
import { EditIcon, TrashIcon } from "./BranchCustomIcons";

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
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [roleError, setRoleError] = useState("");
  // 検索用state
  const [searchName, setSearchName] = useState("");
  const [searchAddress, setSearchAddress] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      const payload = parseJwt(raw);
      if (!payload?.app_metadata.role || (payload.app_metadata.role !== "admin" && payload.app_metadata.role !== "branch_admin")) {
        setRoleError("管理者または支店管理者のみアクセス可能です");
        return;
      }
      setRole(payload.app_metadata.role);
      setBranchId(payload.app_metadata.branch_id || "");
    } else {
      localStorage.removeItem("jwt_token");
      setRoleError("ログイン情報が無効です");
    }
  }, []);

  // 一覧取得
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    if (!role || !raw) return;
    fetchWithAuth(`${API_URL}/branches`)
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  }, [role]);

  // 追加
  const handleAdd = async () => {
    if (!name) return;
    await fetchWithAuth(`${API_URL}/branches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, address }),
    });
    setName("");
    setAddress("");
    // 再取得
    fetchWithAuth(`${API_URL}/branches`)
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
    await fetchWithAuth(`${API_URL}/branches/${editId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: editName, address: editAddress }),
    });
    setEditId(null);
    setEditName("");
    setEditAddress("");
    fetchWithAuth(`${API_URL}/branches`)
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  };

  // 論理削除
  const handleDelete = async (id: string) => {
    await fetchWithAuth(`${API_URL}/branches/${id}`, {
      method: "DELETE",
    });
    fetchWithAuth(`${API_URL}/branches`)
      .then((res) => res.json())
      .then((res) => setBranches(res.data || []));
  };

  if (roleError) {
    return <div className="danger center mt-2">{roleError}</div>;
  }
  return (
    <div className="card" style={{ maxWidth: 900, margin: '2rem auto' }}>
      <CardHeader>
        <CardTitle>支店管理</CardTitle>
        <div style={{ display: "flex"}}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: 12, top: "40%", transform: "translateY(-50%)", color: "#888", width: 18, height: 18 }} />
            <Input
              placeholder="支店名で検索"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              style={{ paddingLeft: 36, width: "100%", color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, fontSize: 16 }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 追加フォーム */}
        <form className="flex mb-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }} onSubmit={e => { e.preventDefault(); handleAdd(); }}>
          <Input
            placeholder="支店名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: '2 1 120px', color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, fontSize: 16 }}
          />
          <Input
            placeholder="住所"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ flex: '3 1 200px', color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, fontSize: 16 }}
          />
          <Button type="submit" style={{ minWidth: 80 }}>
            <Plus size={16} style={{ marginRight: 4 }} />追加
          </Button>
        </form>
        {/* テーブル */}
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>支店名</th>
              <th>住所</th>
              <th colSpan={2} style={{ textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {branches
              .filter((b: any) => b.name.includes(searchName))
              .map((b: any) =>
                editId === b.id ? (
                  <tr key={b.id}>
                    <td>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, fontSize: 16 }}
                      />
                    </td>
                    <td>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        style={{ color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, fontSize: 16 }}
                      />
                    </td>
                    <td colSpan={2} className="flex" style={{ gap: 4, justifyContent: 'center' }}>
                      <Button onClick={handleEdit} style={{ minWidth: 60 }}>保存</Button>
                      <Button onClick={() => setEditId(null)} style={{ minWidth: 60, background: '#e5e7eb', color: '#222' }}>キャンセル</Button>
                    </td>
                  </tr>
                ) : (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td>{b.address}</td>
                    <td colSpan={2} className="flex" style={{ gap: 8, justifyContent: 'center', minWidth: 100 }}>
                      <Button
                        onClick={() => startEdit(b)}
                        className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border-none"
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
                      </Button>
                      <Button
                        onClick={() => handleDelete(b.id)}
                        className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border border-zinc-200"
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
                        aria-label="削除"
                      >
                        <TrashIcon style={{ width: 22, height: 22, color: '#e11d48', display: 'block' }} />
                      </Button>
                    </td>
                  </tr>
                )
              )}
          </tbody>
        </table>
      </CardContent>
    </div>
  );
}

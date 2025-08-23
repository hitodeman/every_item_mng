"use client";
import React, { useEffect, useState } from "react";

// User型を定義
type User = {
  id: string;
  name: string;
  role: string;
  branch_id?: string;
  branchName?: string;
};
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Plus, Search } from "lucide-react";
import { EditIcon, TrashIcon } from "./CustomIcons";
import { Badge } from "./Badge";
// JWTデコード用
import { fetchWithAuth } from "./layout";
// JWTのpayloadをデコードする関数（Supabase Auth access_tokenにも利用可）
function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getRoleBadgeClass(role: string) {
  switch (role) {
    case "admin": return "bg-zinc-900 text-white";
    case "branch_admin": return "bg-zinc-100 text-zinc-600";
    case "user": return "bg-white border border-zinc-300 text-zinc-600";
    default: return "bg-white border border-zinc-300 text-zinc-600";
  }
}
function getRoleLabel(role: string) {
  switch (role) {
    case "admin": return "管理者";
    case "branch_admin": return "支店管理者";
    case "user": return "ユーザー";
    default: return role;
  }
}

type Branch = { id: string; name: string };
export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<User[]>([]); // User[]型で初期化
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      const payload = parseJwt(raw);
      if (!payload?.app_metadata.role || (payload.app_metadata.role !== "admin" && payload.app_metadata.role !== "branch_admin")) {
        // アクセス不可
        setRole("");
        setBranchId("");
        return;
      }
      setRole(payload.app_metadata.role);
      setBranchId(payload.app_metadata.branch_id || "");
      // ユーザーとブランチ情報を同時取得
      Promise.all([
        fetchWithAuth(`${API_URL}/profiles`).then(res => res.json()),
        fetchWithAuth(`${API_URL}/branches`).then(res => res.json())
      ]).then(([profilesRes, branchesRes]) => {
        const branchesArr = Array.isArray(branchesRes.data) ? branchesRes.data : [];
        setBranches(branchesArr);
        console.log("支店情報:", branchesArr);
        const branchMap = new Map<string, string>();
        branchesArr.forEach((b: any) => {
          branchMap.set(b.id, b.name);
        });
        if (Array.isArray(profilesRes.data)) {
          const usersWithBranchName = profilesRes.data.map((user: any) => ({
            ...user,
            branchName: user.branch_id ? branchMap.get(user.branch_id) || "" : ""
          }));
          console.log("ユーザー情報:", usersWithBranchName);
          setUsers(usersWithBranchName);
        } else {
          setUsers([]);
        }
      });
    } else {
      localStorage.removeItem("jwt_token");
      setRole("");
      setBranchId("");
    }
  }, []);
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || "").includes(searchTerm) || (user.id || "").includes(searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  console.log("Filtered Users:", filteredUsers);
  // 編集モーダルの表示
  const openEditModal = (user: User) => {
    setEditUser(user);
    setEditName(user.name);
    setEditBranchId(user.branch_id || "");
    setShowEditModal(true);
  };

  // 編集保存処理
  const handleEditSave = async () => {
    if (!editUser) return;
    const res = await fetchWithAuth(`${API_URL}/profiles/${editUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: editName, branch_id: editBranchId }),
    });
    if (res.ok) {
      // ローカルのusersも更新
      setUsers(users => users.map(u => u.id === editUser.id ? { ...u, name: editName, branch_id: editBranchId, branchName: branches.find(b => b.id === editBranchId)?.name || "" } : u));
      setShowEditModal(false);
    } else {
      alert("更新に失敗しました");
    }
  };

  return (
    <div className="card" style={{ maxWidth: 900, margin: "2rem auto" }}>
      <CardHeader>
        <CardTitle>ユーザー管理</CardTitle>
        <div className="flex gap-4 items-end mt-4">
          <div className="flex-1 flex gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <Input
                placeholder="ユーザーID/氏名で検索"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{ color: '#222', background: '#fff' }}
              />
            </div>
            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="border rounded px-2 py-1 min-w-[100px]">
              <option value="all">全て</option>
              <option value="user">ユーザー</option>
              <option value="branch_admin">支店管理者</option>
              <option value="admin">管理者</option>
            </select>

            <Button type="submit" style={{ minWidth: 80, maxHeight: 35 }}>
            <Plus size={16} style={{ marginRight: 4 }} />追加
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザーID</TableHead>
                <TableHead className="min-w-[150px] w-[150px] max-w-[150px] whitespace-nowrap">氏名</TableHead>
                <TableHead className="min-w-[150px]">ロール</TableHead>
                <TableHead>支店</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm max-w-48 truncate"><div title={user.id}>{user.id}</div></TableCell>
                  <TableCell style={{ minWidth: 150, width: 150, maxWidth: 150, whiteSpace: 'nowrap' }}>{user.name}</TableCell>
                  <TableCell
                    style={{ minWidth: 150, width: 150, maxWidth: 150, whiteSpace: 'nowrap' }}
                  >
                    <Badge
                      variant={
                        user.role === 'admin'
                          ? 'default'
                          : user.role === 'branch_admin'
                          ? 'secondary'
                          : 'outline'
                      }
                      className="text-[14px] font-medium px-4 py-1"
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{user.branchName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" style={{padding:'0 8px',lineHeight:1,overflow:'visible',height:40,minWidth:90}}>
                    <div className="flex gap-1 justify-end" style={{height:40,alignItems:'center'}}>
                      <Button
                        className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border-none !important"
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
                        onClick={() => openEditModal(user)}
                      >
                        <EditIcon style={{ width: 22, height: 22, color: '#334155', display: 'block' }} />
                      </Button>
                      <Button className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border border-zinc-200 !important" 
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
                      aria-label="削除">
                        <TrashIcon style={{ width: 22, height: 22, color: '#e11d48', display: 'block' }} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    {/* 編集モーダル */}
    {showEditModal && (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
          <h2 style={{ fontWeight: 600, fontSize: 20, marginBottom: 16 }}>ユーザー編集</h2>
          <div style={{ marginBottom: 16 }}>
            <Label>氏名</Label>
            <Input value={editName} onChange={e => setEditName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Label>支店</Label>
            <select value={editBranchId} onChange={e => setEditBranchId(e.target.value)} className="border rounded px-2 py-1 w-full">
              <option value="">未設定</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4 justify-end">
            <Button onClick={() => setShowEditModal(false)}>キャンセル</Button>
            <Button onClick={handleEditSave}>保存</Button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
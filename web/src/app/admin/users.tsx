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

export default function UsersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState<User[]>([]); // User[]型で初期化
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      setToken(raw);
      const payload = parseJwt(raw);
      setUserId(payload?.id ?? null);
      // ユーザーとブランチ情報を同時取得
      Promise.all([
        fetch(`${API_URL}/profiles`, {
          headers: { Authorization: `Bearer ${raw}` },
        }).then(res => res.json()),
        fetch(`${API_URL}/branches`, {
          headers: { Authorization: `Bearer ${raw}` },
        }).then(res => res.json())
      ]).then(([profilesRes, branchesRes]) => {
        const branches = Array.isArray(branchesRes.data) ? branchesRes.data : [];
        const branchMap = new Map<string, string>();
        branches.forEach((b: any) => {
          branchMap.set(b.id, b.name);
        });
        if (Array.isArray(profilesRes.data)) {
          const usersWithBranchName = profilesRes.data.map((user: any) => ({
            ...user,
            branchName: user.branch_id ? branchMap.get(user.branch_id) || "" : ""
          }));
          setUsers(usersWithBranchName);
        } else {
          setUsers([]);
        }
      });
    } else {
      localStorage.removeItem("jwt_token");
      setToken("");
      setUserId(null);
    }
  }, []);
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || "").includes(searchTerm) || (user.id || "").includes(searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  console.log("Filtered Users:", filteredUsers);
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
    </div>
  );
}

"use client";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Plus, Search } from "lucide-react";
import { EditIcon, TrashIcon } from "./CustomIcons";
import { Badge } from "./Badge";

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
  // TODO: API連携・state管理は既存profiles.tsxを参考に移植
  // ここではUIのみFigma準拠で作成
  const [searchTerm, setSearchTerm] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  // 仮データ
  // 仮データに在庫数(stock)を追加
  const users = [
    { id: "1fcabda7-528b-4f20-aa73-957da5a677e4", userName: "管理者", role: "admin", branchId: "2bb58a5-aa7f-41bb-a653-ea4200fc31b8", branchName: "本店", stock: 1234 },
    { id: "880aeac52-36ce-47e4-84aa-bdaa00c99375", userName: "支店管理者", role: "branch_admin", branchId: "83ee7e4c-8f9a-4d63-9dfb-ff0b2698c1f", branchName: "東京支店", stock: 56789 },
    { id: "9002e7af-30ad-4f8e-a391-fb265ceaf8", userName: "一般ユーザー", role: "user", branchId: "83ee7e4c-8f9a-4d63-9dfb-ff0b2698c1f", branchName: "東京支店", stock: 42 },
  ];
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.userName.includes(searchTerm) || user.id.includes(searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });
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
          </div>
          <Button className="ml-auto bg-zinc-900 hover:bg-zinc-700 text-white px-6 h-10 flex items-center justify-center gap-2 rounded-lg shadow-none border-none !important" style={{background:'#18181b',color:'#fff',border:'none',height:40,padding:'0 1.5rem',borderRadius:8,boxShadow:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Plus className="w-6 h-6" />
            <span style={{lineHeight:'1'}}>追加</span>
          </Button>
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
                  <TableCell style={{ minWidth: 150, width: 150, maxWidth: 150, whiteSpace: 'nowrap' }}>{user.userName}</TableCell>
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
                      <div className="font-mono text-sm text-zinc-400 truncate max-w-32"><span title={user.branchId}>{user.branchId}</span></div>
                      <div className="text-sm">{user.branchName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" style={{padding:'0 8px',lineHeight:1,overflow:'visible',height:40,minWidth:90}}>
                    <div className="flex gap-1 justify-end" style={{height:40,alignItems:'center'}}>
                      <Button
                        className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border-none !important"
                        style={{background:'#18181b',color:'#fff',border:'none',height:40,width:40,borderRadius:8,boxShadow:'none',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}
                        aria-label="編集"
                      >
                        <EditIcon style={{color:'#fff',display:'block'}} />
                      </Button>
                      <Button className="rounded-lg w-10 h-10 flex items-center justify-center p-0 border border-zinc-200 !important" style={{background:'#fff',color:'#e11d48',border:'1px solid #e5e7eb',height:40,width:40,borderRadius:8,boxShadow:'none',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}} aria-label="削除">
                        <TrashIcon style={{color:'#e11d48',display:'block'}} />
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

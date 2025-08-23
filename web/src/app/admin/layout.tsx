"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Users, Package, TrendingUp, FileText, Settings, Building2 } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";

// JWT付きfetchラッパー
export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt_token") : null;
  if (!token) {
    throw new Error("ログイン情報がありません");
  }
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [roleError, setRoleError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const checkRole = () => {
      const raw = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
      const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      if (!raw || !jwtPattern.test(raw)) {
        router.replace("/login");
        return;
      }
      // JWTからrole, branch_id, user idを取得
      let payload: any = {};
      try {
        payload = JSON.parse(atob(raw.split('.')[1]));
      } catch {}
      if (!payload.sub || !payload.app_metadata.role) {
        router.replace("/login");
        return;
      }
      if (payload.app_metadata.role !== "admin" && payload.app_metadata.role !== "branch_admin") {
        console.log(payload);
        setRoleError("管理者または支店管理者のみアクセス可能です（layout）");
        setChecking(false);
        return;
      }
      setRole(payload.app_metadata.role);
      setBranchId(payload.app_metadata.branch_id || "");
      setChecking(false);
    };
    checkRole();
  }, [router]);
  if (checking) {
    return null;
  }
  if (roleError) {
    return <div className="danger center mt-2">{roleError}</div>;
  }

  // サイドバーのメニュー（Figma準拠アイコン付）
  const menu = [
    ...(role === "admin"
      ? [
          {
            label: "支店管理",
            href: "/admin/branches",
            icon: <Building2 size={18} style={{marginRight: 12}} />,
          },
        ]
      : []),
    {
      label: "ユーザー管理",
      href: "/admin/profiles",
      icon: <Users size={18} style={{marginRight: 12}} />,
    },
    {
      label: "在庫アイテム管理",
      href: "/admin/items",
      icon: <Package size={18} style={{marginRight: 12}} />,
    },
    {
      label: "在庫分析",
      href: "/admin/items/analytics",
      icon: <TrendingUp size={18} style={{marginRight: 12}} />,
    },
    {
      label: "操作ログ",
      href: "/admin/logs",
      icon: <FileText size={18} style={{marginRight: 12}} />,
    },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <aside
        style={{
          width: 220,
          background: "#fff",
          borderRight: "1px solid var(--border)",
          padding: "2rem 1rem 2rem 1.5rem",
          boxShadow: "var(--shadow)",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24, letterSpacing: 1 }}>管理メニュー</div>
        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {menu.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`admin-sidebar-link${active ? " active" : ""}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "0.7rem 1rem",
                      borderRadius: "var(--radius)",
                      background: active ? "var(--primary)" : "transparent",
                      color: active ? "#fff" : "var(--foreground)",
                      fontWeight: active ? 600 : 400,
                      textDecoration: "none",
                      transition: "background 0.2s, color 0.2s",
                    }}
                  >
                    {React.cloneElement(item.icon, {
                      color: active ? "#fff" : "var(--primary)",
                    })}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main style={{ flex: 1, minHeight: "100vh", padding: "2.5rem 2rem 2rem 2rem", background: "var(--background)" }}>
        {children}
      </main>
    </div>
  );
}

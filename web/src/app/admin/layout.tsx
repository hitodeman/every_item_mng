"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Users, Package, TrendingUp, FileText, Settings } from "lucide-react";

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string>("");
  const [roleError, setRoleError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!raw || !jwtPattern.test(raw)) {
      router.replace("/login");
      return;
    }
    const payload = parseJwt(raw);
    if (payload?.role !== "admin" && payload?.role !== "branch_admin") {
      setRoleError("管理者または支店管理者のみアクセス可能です");
    }
    setRole(payload?.role || "");
    setChecking(false);
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
            icon: <Settings size={18} style={{marginRight: 12}} />,
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

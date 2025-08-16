"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [roleError, setRoleError] = useState("");
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!raw || !jwtPattern.test(raw)) {
      router.replace("/login");
      return;
    }
    const payload = parseJwt(raw);
    if (payload?.role !== "admin") {
      setRoleError("管理者のみアクセス可能です");
    }
    setChecking(false);
  }, [router]);
  if (checking) {
    return null;
  }
  if (roleError) {
    return <div style={{ color: 'red', margin: '2rem' }}>{roleError}</div>;
  }
  return <div>{children}</div>;
}

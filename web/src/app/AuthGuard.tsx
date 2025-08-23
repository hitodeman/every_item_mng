"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/login") return;
    // Supabase Authのaccess_tokenをjwt_tokenとしてlocalStorageに保存している前提
    const raw = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!raw || !jwtPattern.test(raw)) {
      router.replace("/login");
      return;
    }
    // 有効期限(exp)チェック
    try {
      const payload = JSON.parse(atob(raw.split('.')[1]));
      if (payload.exp && typeof payload.exp === "number") {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          localStorage.removeItem("jwt_token");
          router.replace("/login");
          return;
        }
      }
    } catch {}
  }, [pathname, router]);
  return <>{children}</>;
}

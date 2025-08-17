"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const router = useRouter();
  useEffect(() => {
    if (pathname === "/login") return;
    const raw = typeof window !== "undefined" ? localStorage.getItem("jwt_token") || "" : "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!raw || !jwtPattern.test(raw)) {
      router.replace("/login");
    }
  }, [pathname, router]);
  return <>{children}</>;
}

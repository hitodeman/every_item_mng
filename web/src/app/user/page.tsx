"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserRoot() {
  const router = useRouter();
  useEffect(() => {
    // /user/items へリダイレクト
    router.replace("/user/items");
  }, [router]);
  return null;
}

import Link from "next/link";

export default function AdminMenu() {
  // ロール取得
  let role = "";
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("jwt_token") || "";
    try {
      role = JSON.parse(atob(raw.split('.')[1])).role;
    } catch {}
  }
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>管理メニューTOP</h1>
    </div>
  );
}

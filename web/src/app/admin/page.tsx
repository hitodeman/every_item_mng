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
      <h1>管理メニュー</h1>
      <ul>
        {role === "admin" && (
          <li>
            <Link href="/admin/branches">支店管理</Link>
          </li>
        )}
        <li>
          <Link href="/admin/profiles">ユーザー管理</Link>
        </li>
        <li>
          <Link href="/admin/items">在庫アイテム管理</Link>
        </li>
        <li>
          <Link href="/admin/items/analytics">在庫分析</Link>
        </li>
        <li>
          <Link href="/admin/logs">操作ログ</Link>
        </li>
      </ul>
    </div>
  );
}

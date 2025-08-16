import Link from "next/link";

export default function AdminMenu() {
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>管理メニュー</h1>
      <ul>
        <li>
          <Link href="/admin/branches">支店管理</Link>
        </li>
        <li>
          <Link href="/admin/profiles">ユーザー管理</Link>
        </li>
      </ul>
    </div>
  );
}

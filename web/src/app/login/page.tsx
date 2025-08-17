"use client";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError("ログイン失敗: ユーザー名またはパスワードが正しくありません");
      return;
    }
    const data = await res.json();
    if (data.token) {
      // JWT形式チェック（英数字・ハイフン・アンダースコア・ドット3分割）
      const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      if (jwtPattern.test(data.token)) {
        localStorage.setItem("jwt_token", data.token);
        setSuccess("ログイン成功。管理画面に遷移してください。");
      } else {
        setError("不正なトークン形式です");
      }
    } else {
      setError("トークン取得失敗");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto" }}>
      <h2>ログイン</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, padding: '10px 12px', width: '100%', fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ color: '#222', background: '#fff', border: '1px solid #ccc', borderRadius: 6, padding: '10px 12px', width: '100%', fontSize: 16 }}
          />
        </div>
        <button type="submit">ログイン</button>
      </form>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 16 }}>{success}</div>}
    </div>
  );
}

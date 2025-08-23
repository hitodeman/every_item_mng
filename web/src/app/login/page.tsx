"use client";


import { createClient } from "@supabase/supabase-js";
import React, { useState } from "react";
import Link from "next/link";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      setError("ログイン失敗: メールアドレスまたはパスワードが正しくありません");
      return;
    }
    const token = data.session.access_token;
    if (token) {
      localStorage.setItem("jwt_token", token);
      setSuccess("ログイン成功。管理画面に遷移してください。");
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
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <span>アカウントをお持ちでない方は </span>
        <Link href="/signup" style={{ color: '#2563eb', textDecoration: 'underline' }}>サインアップ</Link>
      </div>
      {error && <div style={{ color: "red", marginTop: 16 }}>{error}</div>}
      {success && <div style={{ color: "green", marginTop: 16 }}>{success}</div>}
    </div>
  );
}

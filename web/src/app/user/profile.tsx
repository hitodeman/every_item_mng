"use client";
import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function UserProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [editName, setEditName] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [success, setSuccess] = useState("");

  // JWTデコード
  function parseJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (jwtPattern.test(raw)) {
      setToken(raw);
      const payload = parseJwt(raw);
      setUserId(payload?.id ?? null);
    }
  }, []);

  useEffect(() => {
    if (!token || !userId) return;
    fetch(`${API_URL}/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(res => {
        if (res.data && res.data.length > 0) {
          setProfile(res.data[0]);
          setEditName(res.data[0].name || "");
          setEditBranch(res.data[0].branch_id || "");
        }
      });
  }, [token, userId]);

  // user権限以外はアクセス不可
  useEffect(() => {
    const raw = localStorage.getItem("jwt_token") || "";
    const payload = parseJwt(raw);
    if (payload?.role !== "user") {
      setError("一般ユーザーのみアクセス可能です");
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!editName) { setError("氏名は必須です"); return; }
    const res = await fetch(`${API_URL}/profiles/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: editName, branch_id: editBranch, role: "user" })
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "更新失敗");
    else setSuccess("更新成功");
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>プロフィール（一般ユーザー）</h2>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>{success}</div>}
      {profile && (
        <form onSubmit={handleUpdate} style={{ marginBottom: 24 }}>
          <div>ユーザーID: {profile.id}</div>
          <div>ロール: {profile.role}</div>
          <div>支店ID: <input value={editBranch} onChange={e => setEditBranch(e.target.value)} /></div>
          <div>氏名: <input value={editName} onChange={e => setEditName(e.target.value)} /></div>
          <button type="submit">更新</button>
        </form>
      )}
    </div>
  );
}

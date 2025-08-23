"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import styles from "./page.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage("登録に失敗しました: " + error.message);
    } else {
      setMessage("確認メールを送信しました。メールをご確認ください。");
    }
  };

  return (
    <div className={styles.container}>
  <h2 className={styles.title}>サインアップ</h2>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <button
          type="submit"
          disabled={loading}
          className={
            loading
              ? `${styles.button} ${styles.buttonDisabled}`
              : styles.button
          }
        >
          {loading ? "登録中..." : "登録"}
        </button>
      </form>
      {message && <div className={styles.message}>{message}</div>}
    </div>
  );
}

# APIサーバ仕様まとめ

## 概要
Node.js (Express) による認証・権限管理付きAPIサーバ。JWT認証、ロールベースアクセス制御（RBAC）、Supabase連携（RLSサンプル）を実装。

---

## 機能一覧

### 1. ユーザー認証
- JWTによるトークン認証
- テスト用ユーザー（admin/user）をサーバ内で管理
- パスワードはbcryptでハッシュ化

#### エンドポイント
- `POST /login` : ログイン（JWT発行）
- `POST /logout` : ログアウト（クライアント側でトークン破棄）

### 2. ロールベースアクセス制御（RBAC）
- JWTに含まれるroleでAPIアクセス制御
- `authorizeRole`ミドルウェアでロール判定

#### エンドポイント
- `GET /me` : ログインユーザー情報取得（認証必須）
- `GET /admin-only` : 管理者のみアクセス可
- `GET /user-or-admin` : adminまたはuserがアクセス可

### 3. Supabase連携（RLSサンプル）
- Supabaseのitemsテーブルからデータ取得
- admin: 全件取得
- user: 自分のuser_idに紐づくデータのみ取得

#### エンドポイント
- `GET /supabase-items` : ロールに応じたitems取得

### 4. その他
- `GET /health` : ヘルスチェック

---

## ミドルウェア
- `authenticateToken` : JWT検証
- `authorizeRole(roles)` : ロール判定

---

## テストユーザー例
| username  | password     | role  |
|-----------|-------------|-------|
| testuser  | password123 | admin |
| user1     | userpass    | user  |

---

## Supabase連携・RLS設計例
- itemsテーブル: user_id (uuid) カラムでユーザー紐付け
- RLS: userは自分のuser_idのみ参照可、adminは全件参照可

---

## 注意事項
- 本番運用時はユーザー情報をDB管理に変更推奨
- Supabase連携には有効なuser_id（uuid）が必要
- JWTシークレットは環境変数で管理

# APIサーバ仕様まとめ

## 概要
Node.js (Express) による認証・権限管理付きAPIサーバ。JWT認証、ロールベースアクセス制御（RBAC）、Supabase連携（RLSサンプル）を実装。

---


## 機能一覧

### 1. ユーザー認証・管理
- JWTによるトークン認証
- テスト用ユーザー（admin/user）をサーバ内で管理
- パスワードはbcryptでハッシュ化
- Supabase Auth（auth.users）とprofilesテーブルによるユーザー管理

#### エンドポイント
- `POST /login` : ログイン（JWT発行）
- `POST /logout` : ログアウト（クライアント側でトークン破棄）
- `GET /profiles` : ユーザープロファイル一覧取得
- `POST /profiles` : ユーザープロファイル追加
- `PUT /profiles/:id` : ユーザープロファイル編集
- `DELETE /profiles/:id` : ユーザープロファイル削除

### 2. 支店管理
- branchesテーブルによる支店情報管理（CRUD、論理削除）

#### エンドポイント
- `GET /branches` : 支店一覧取得
- `POST /branches` : 支店追加
- `PUT /branches/:id` : 支店編集
- `DELETE /branches/:id` : 支店論理削除

### 3. ロールベースアクセス制御（RBAC）・RLS
- JWTに含まれるroleでAPIアクセス制御
- `authorizeRole`ミドルウェアでロール判定
- Supabase RLSでDBレベルのアクセス制御

#### エンドポイント
- `GET /me` : ログインユーザー情報取得（認証必須）
- `GET /admin-only` : 管理者のみアクセス可
- `GET /user-or-admin` : adminまたはuserがアクセス可

### 4. 在庫アイテム管理（items）
- Supabaseのitemsテーブルからデータ取得
- admin: 全件取得
- user: 自分のuser_idに紐づくデータのみ取得

#### エンドポイント
- `GET /supabase-items` : ロールに応じたitems取得

### 5. Web管理画面（Next.js）
- /admin/branches : 支店管理画面（CRUD）
- /admin/profiles : ユーザー管理画面（CRUD）
- /login : ログイン画面（JWTトークン自動保存）

### 6. その他
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
- branchesテーブル: is_deletedで論理削除、RLSでロール・所属支店制御
- profilesテーブル: id=auth.users.id、branch_idで支店紐付け、RLSでロール・本人制御
- RLS: userは自分のuser_id/branch_idのみ参照可、adminは全件参照可

---

## Web管理画面の仕様
- Next.js (app router) によるPWA対応
- JWTトークンはlocalStorageで管理
- APIサーバーと分離構成
- ログイン後、管理画面でCRUD操作が可能

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

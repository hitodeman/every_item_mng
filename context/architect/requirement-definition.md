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

### 3. ロールベースアクセス制御（RBAC）・RLS・認証ガード

- JWTに含まれるroleでAPIアクセス制御
- `authorizeRole`ミドルウェアでロール判定
- Supabase RLSでDBレベルのアクセス制御
- Webアプリ側でも全ページ共通で認証・認可ガードを実装
	- `/login`以外の全ページで「未ログイン時は/loginへリダイレクト」
	- `/admin`配下は`role: admin`のみアクセス可（それ以外は「管理者のみアクセス可能です」と表示、認証判定中は何も表示しない）
	- `/user`配下は`role: user`のみアクセス可（それ以外は「一般ユーザーのみアクセス可能です」と表示、認証判定中は何も表示しない）
	- 認証判定中は何も描画しないことで「フラッシュ現象」を防止

#### エンドポイント
- `GET /me` : ログインユーザー情報取得（認証必須）
- `GET /admin-only` : 管理者のみアクセス可
- `GET /user-or-admin` : adminまたはuserがアクセス可


### 4. 在庫アイテム管理・在庫数増減・履歴管理（items, items_history）

- Supabaseのitemsテーブルからデータ取得
- admin: 全件取得
- user: 自分のuser_idに紐づくデータのみ取得

#### バリデーション仕様（フロントエンド/バックエンド共通）
- 金額（price）: 半角数字のみ、最大4桁（0〜9999）、整数、日本円として扱う
	- 例: `/^[0-9]{1,4}$/` で正規表現チェック、0以上9999以下
- 単位（unit）: 空欄不可、1〜5文字以内
	- 例: `unit.length >= 1 && unit.length <= 5`
- バリデーションは追加・編集時に必須。エラー時は「金額は0〜9999の半角数字で入力してください」「単位は1〜5文字で入力してください」等のメッセージを返す。

#### 在庫数増減・履歴管理
- 在庫数増減API（POST /items/:id/stock）で在庫数を増減し、items_historyテーブルに履歴を記録
- 閾値アラート: 在庫数がthreshold未満になるとalert/alert_messageをAPIレスポンスで返却し、Web画面でアラート表示
- 履歴取得API（GET /items/:id/history）で増減履歴を取得

#### エンドポイント
- `GET /supabase-items` : ロールに応じたitems取得
- `POST /items/:id/stock` : 在庫数増減・閾値アラート返却
- `GET /items/:id/history` : 在庫増減履歴取得

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

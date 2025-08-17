
# System Architecture (Mermaid)


```mermaid
flowchart TD
  subgraph Web
    A1[app]
    A2[public]
    A3[pages components hooks]
  end
  subgraph API
    B1[src indexjs auth RBAC API]
    B2[src supabaseClientjs Supabase]
    B3[env envvars]
  end
  subgraph Context
    C1[taskmd tasks]
    C2[specificationmd spec]
    C3[designdocmd design]
  end
```

---

## システム構成図


```mermaid
graph TD
  subgraph クライアント
    A1[Next.js PWA]
    A2[管理画面 /admin/branches /admin/profiles /admin/items]
    A3[ログイン画面 /login]
    A4[在庫数増減・履歴・アラート表示]
    A5[支店管理者branch_adminは自支店の全ユーザーのアイテム・ユーザー管理が可能]
  end
  subgraph APIサーバー
    B1[Express API]
    B2[JWT認証/RBAC admin/branch_admin/user]
    B3[Supabase JS Client]
    B4[在庫数増減API・履歴API・閾値アラート返却]
    B5[branch_adminは自支店の全ユーザー分のデータ取得・管理可]
  end
  subgraph DB
    C1[Supabase/PostgreSQL]
    C2[auth.users/profiles/branches/items/items_history]
    C3[RLS 行レベルセキュリティ]
  end
  A1--APIリクエスト/JWT-->B1
  A2--CRUD操作/JWT-->B1
  A3--ログイン/認証-->B1
  B1--DBアクセス-->B3
  B3--SQL/RLS-->C1
```

### 管理画面
- /admin/branches: 支店管理（CRUD、adminのみ）
- /admin/profiles: ユーザー管理（CRUD、admin/branch_admin。branch_adminは自支店ユーザーのみ管理可、支店IDは自動付与・非表示）
- /admin/items: 在庫アイテム管理・在庫数増減・履歴・アラート表示（admin/branch_admin。branch_adminは自支店の全ユーザー分管理可）
- /login: ログイン画面（JWT保存）

### APIサーバー
- Node.js/Express, JWT認証, RBAC, Supabase JS Client
- 在庫数増減API・履歴API・閾値アラート返却

### DB
- Supabase/PostgreSQL, RLS, auth.users, branches, profiles, items, items_history
- 管理画面: /admin/branches, /admin/profiles, /login
- APIサーバー: Node.js/Express, JWT認証, RBAC, Supabase JS Client
- DB: Supabase/PostgreSQL, RLS, auth.users, branches, profiles, items

---

## データフロー
1. クライアントでログイン（/login）
2. JWTトークンをlocalStorageに保存
3. APIサーバーへリクエスト時にJWTを付与
4. APIサーバーで認証・RBAC判定
5. Supabase DBへアクセス（RLS有効）
6. クライアントで管理画面（支店・ユーザー・在庫アイテム管理、在庫数増減・履歴・アラート表示）操作

---

## 認証・権限
- JWTトークンにrole, user_idを含める
- RBAC: APIサーバーでrole判定
- RLS: DBでuser_id/role/branch_idによる制御

※補足
- JWTトークンはlocalStorage保存時・取得時に正規表現で形式チェック（サニタイズ）を実装し、不正な値は保存・利用しない
- XSS対策として、トークン値のUI出力やdangerouslySetInnerHTML等は利用しない

---



---


- Supabase JS ClientでAPIサーバーからDB操作
- RLS有効化、adminは全件、userは自分のbranch_id/ユーザーのみ参照可
- items_historyテーブルで在庫数増減履歴・閾値アラートも管理

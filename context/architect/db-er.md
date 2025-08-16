

# ER図（Mermaid）

```mermaid
erDiagram
  users {
    uuid id PK "ユーザーID (Supabase Auth UUID)"
    text email "メールアドレス"
    text role "ロール (admin/user)"
    text name "氏名"
    timestamp created_at
  }

  branches {
    uuid id PK "支店ID"
    text name "支店名"
    text address "住所"
    boolean is_deleted "論理削除フラグ"
    timestamp created_at
  }

  profiles {
    uuid id PK "ユーザーID (auth.users.id)"
    text name "氏名"
    text role "ロール"
    uuid branch_id FK "所属支店ID"
    timestamp created_at
  }

  items {
    int id PK "アイテムID"
    uuid user_id FK "所有ユーザーID"
    text name "アイテム名"
    int quantity "在庫数"
    int price "金額"
    timestamp created_at
  }

  users ||--o{ items : "has"
  users ||--o| profiles : "has profile"
  branches ||--o{ profiles : "has users"
  profiles ||--o{ items : "has items"
```

---

- users: Supabase Authユーザー情報（UUID主キー）
- branches: 支店情報（UUID主キー、論理削除対応）
- profiles: アプリ用ユーザープロファイル（auth.users.idを参照、branch_idで支店紐付け）
- items: 在庫アイテム情報（user_idでprofilesと紐付け）
- RLS: 各テーブルでロール・所有者・論理削除等に応じたアクセス制御

---

## ROLE（ロール）について

- `profiles.role` カラムでユーザーの権限を管理します。
  - `admin`: 全データ参照・管理可能
  - `user`: 自分のデータのみ参照・操作可能
- API・DB（RLS）両方でロール判定を行い、アクセス制御を実現しています。
- ロールは今後の拡張で追加可能です。

---

## RLS（Row Level Security）設計概要

- branches: 管理者のみ全件操作可、userは自分の所属支店のみ参照可
- profiles: 管理者のみ全件操作可、userは自分のプロフィールのみ参照・編集可
- items: userは自分のuser_idのみ参照可、adminは全件参照可


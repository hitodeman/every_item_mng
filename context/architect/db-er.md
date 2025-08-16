
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

  items {
    int id PK "アイテムID"
    uuid user_id FK "所有ユーザーID"
    text name "アイテム名"
    int quantity "在庫数"
    int price "金額"
    timestamp created_at
  }

  users ||--o{ items : "has"
```



- users: Supabase Authユーザー情報（UUID主キー）
- items: 在庫アイテム情報（user_idでusersと紐付け）
- RLS: items.user_idでアクセス制御

---

## ROLE（ロール）について

- `users.role` カラムでユーザーの権限を管理します。
  - `admin`: 全データ参照・管理可能
  - `user`: 自分のデータのみ参照・操作可能
- API・DB（RLS）両方でロール判定を行い、アクセス制御を実現しています。
- ロールは今後の拡張で追加可能です。

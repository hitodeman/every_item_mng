-- 操作ログテーブル: operation_logs
CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  operation TEXT NOT NULL, -- 例: 'create', 'update', 'delete', 'login', 'export_csv' など
  target_type TEXT NOT NULL, -- 例: 'item', 'branch', 'profile', 'login', 'csv_export' など
  target_id TEXT, -- 操作対象のID（該当しない場合はNULL可）
  detail TEXT, -- 操作内容の詳細（JSON文字列や説明）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

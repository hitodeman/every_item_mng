-- 既存ポリシーがあれば削除
DROP POLICY IF EXISTS "Admin can select all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Branch admin can select own branch profiles" ON profiles;
DROP POLICY IF EXISTS "Branch admin can update own branch profiles" ON profiles;
DROP POLICY IF EXISTS "User can select own profile" ON profiles;
DROP POLICY IF EXISTS "User can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Branch admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
-- profilesテーブル RLS有効化＆ポリシー

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 管理者は全件参照・更新可
CREATE POLICY "Admin can select all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- 支店管理者は自支店ユーザーのみ参照・更新可
CREATE POLICY "Branch admin can select own branch profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'branch_admin' AND p.branch_id = profiles.branch_id
    )
  );
CREATE POLICY "Branch admin can update own branch profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'branch_admin' AND p.branch_id = profiles.branch_id
    )
  );

-- 一般ユーザーは自分のプロフィールのみ参照・更新可
CREATE POLICY "User can select own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "User can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- INSERTは管理者・支店管理者のみ許可（必要に応じて）
CREATE POLICY "Admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
CREATE POLICY "Branch admin can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'branch_admin')
  );

-- DELETEは管理者のみ許可（必要に応じて）
CREATE POLICY "Admin can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

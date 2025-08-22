


import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from "path";
import { fileURLToPath } from "url";

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Parser as Json2csvParser } from 'json2csv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


const app = express();
const port = process.env.PORT || 4000;

// 操作ログ記録関数
async function recordOperationLog({ user, operation, target_type, target_id = null, detail = null }) {
  await supabase.from('operation_logs').insert({
    user_id: user.id,
    username: user.username,
    role: user.role,
    operation,
    target_type,
    target_id,
    detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : null,
  });
}

// テスト用ユーザー（本番はDB管理推奨）
// idはuuidで運用
const users = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'testuser',
    passwordHash: bcrypt.hashSync('password123', 10), // パスワード: password123
    role: 'admin',
  },
  {
    id: '880eec62-36ce-47e4-84aa-bdab00c99375',
    username: 'branchadmin1',
    passwordHash: bcrypt.hashSync('branchpass', 10), // パスワード: branchpass
    role: 'branch_admin',
  },
  {
    id: '900e27a7-30aa-4f8b-a391-fd2526acaff8',
    username: 'user1',
    passwordHash: bcrypt.hashSync('userpass', 10), // パスワード: userpass
    role: 'user',
  },
];
// ロール判定ミドルウェア
function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_EXPIRES_IN = '1h';

app.use(cors());
app.use(express.json());


// JWT認証ミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ログインAPI

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  // idはuuidでJWTにセット
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  // 操作ログ記録
  await recordOperationLog({ user, operation: 'login', target_type: 'login', detail: 'ログイン' });
  res.json({ token });
});

// ログアウトAPI（クライアント側でトークン破棄）
app.post('/logout', (req, res) => {
  // JWTはステートレスなのでサーバ側で明示的な無効化はしない
  res.json({ message: 'Logged out (token should be discarded on client)' });
});


// 認証が必要なテストAPI
app.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// 管理者・支店管理者のみアクセス可能なAPI例
app.get('/admin-or-branchadmin', authenticateToken, authorizeRole(['admin', 'branch_admin']), (req, res) => {
  res.json({ message: '管理者または支店管理者のみアクセス可能', user: req.user });
});

// 一般ユーザー・支店管理者・管理者がアクセス可能なAPI例
app.get('/user-or-branchadmin-or-admin', authenticateToken, authorizeRole(['admin', 'branch_admin', 'user']), (req, res) => {
  res.json({ message: 'adminまたはbranch_adminまたはuserがアクセス可能', user: req.user });
});


// Supabase RLSサンプルAPI（admin:全件, branch_admin:自支店, user:自分のみ）
app.get('/supabase-items', authenticateToken, async (req, res) => {
  let query = supabase.from('items').select('*');
  if (req.user.role === 'branch_admin') {
    // 支店管理者は自分の支店のアイテムのみ
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError) return res.status(500).json({ error: profileError.message });
    query = query.eq('branch_id', profile.branch_id);
  } else if (req.user.role !== 'admin') {
    // 一般ユーザーは自分のidに紐づくデータのみ
    query = query.eq('user_id', req.user.id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});


// Supabase RLSサンプルAPI（adminのみ全件、userは自分のデータのみ取得）
app.get('/supabase-items', authenticateToken, async (req, res) => {
  let query = supabase.from('items').select('*');
  if (req.user.role !== 'admin') {
    // userは自分のidに紐づくデータのみ取得（例: user_idカラム）
    query = query.eq('user_id', req.user.id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});


// --- 支店（branches）CRUD ---
// 一覧取得（admin:全件, branch_admin:自支店, user:自支店のみ）
app.get('/branches', authenticateToken, async (req, res) => {
  let query = supabase.from('branches').select('*').eq('is_deleted', false);
  if (req.user.role === 'branch_admin') {
    // 支店管理者は自分の支店のみ
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError) return res.status(500).json({ error: profileError.message });
    query = query.eq('id', profile.branch_id);
  } else if (req.user.role !== 'admin') {
    // 一般ユーザーは自分の支店のみ
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError) return res.status(500).json({ error: profileError.message });
    query = query.eq('id', profile.branch_id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 追加（adminのみ）
app.post('/branches', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { name, address } = req.body;
  const { data, error } = await supabase.from('branches').insert([{ name, address }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 編集（adminのみ）
app.put('/branches/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;
  const { data, error } = await supabase.from('branches').update({ name, address }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 論理削除（adminのみ）
app.delete('/branches/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('branches').update({ is_deleted: true }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// --- ユーザープロファイル（profiles）CRUD ---
// 一覧取得（admin:全件, branch_admin:自支店, user:自分のみ）
app.get('/profiles', authenticateToken, async (req, res) => {
  let query = supabase.from('profiles').select('*');
  if (req.user.role === 'branch_admin') {
    // 支店管理者は自分の支店のユーザーのみ
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError) return res.status(500).json({ error: profileError.message });
    query = query.eq('branch_id', profile.branch_id);
  } else if (req.user.role !== 'admin') {
    // 一般ユーザーは自分のみ
    query = query.eq('id', req.user.id);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 追加（adminのみ）
app.post('/profiles', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id, name, role, branch_id } = req.body;
  const { data, error } = await supabase.from('profiles').insert([{ id, name, role, branch_id }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 編集（adminは任意、userは自分のみ）
app.put('/profiles/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, role, branch_id } = req.body;
  const { data, error } = await supabase.from('profiles').update({ name, role, branch_id }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 論理削除は行わず、物理削除API（adminのみ）
app.delete('/profiles/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('profiles').delete().eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});


// --- 在庫数増減 ---
// POST /items/:id/stock { change: number, reason?: string }
app.post('/items/:id/stock', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { change, reason } = req.body;
  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({ error: 'changeは非ゼロの整数で指定してください' });
  }
  // 現在の在庫・閾値取得
  const { data: items, error: getErr } = await supabase.from('items').select('stock, threshold').eq('id', id).single();
  if (getErr || !items) return res.status(404).json({ error: 'アイテムが見つかりません' });
  const before_stock = items.stock;
  const after_stock = before_stock + change;
  const threshold = items.threshold;
  if (after_stock < 0) return res.status(400).json({ error: '在庫数がマイナスになります' });
  // 在庫数更新
  const { error: updateErr } = await supabase.from('items').update({ stock: after_stock }).eq('id', id);
  if (updateErr) return res.status(500).json({ error: updateErr.message });
  // 履歴記録
  const { error: histErr } = await supabase.from('items_history').insert({
    item_id: id,
    user_id: req.user.id,
    change,
    before_stock,
    after_stock,
    reason: reason || null
  });
  if (histErr) return res.status(500).json({ error: histErr.message });
  // 操作ログ記録
  await recordOperationLog({
    user: req.user,
    operation: 'stock_change',
    target_type: 'item',
    target_id: id,
    detail: { change, reason }
  });
  // 閾値アラート判定
  let alert = false, alert_message = "";
  if (after_stock < threshold) {
    alert = true;
    alert_message = `在庫数が閾値(${threshold})を下回りました`;
  }
  res.json({ after_stock, threshold, alert, alert_message });
});
// --- 操作ログ一覧取得 ---
// GET /operation-logs?limit=100&offset=0
app.get('/operation-logs', authenticateToken, authorizeRole(['admin', 'branch_admin', 'user']), async (req, res) => {
  // 支店管理者ロール追加時はここで分岐
  const { limit = 100, offset = 0 } = req.query;
  let query = supabase.from('operation_logs').select('*').order('created_at', { ascending: false });
  if (req.user.role === 'branch_admin') {
    // 支店管理者は自分の支店のユーザーの操作ログのみ
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError) return res.status(500).json({ error: profileError.message });
    // まず同じ支店のユーザー一覧を取得
    const { data: users, error: usersError } = await supabase.from('profiles').select('id').eq('branch_id', profile.branch_id);
    if (usersError) return res.status(500).json({ error: usersError.message });
    const userIds = users.map(u => u.id);
    query = query.in('user_id', userIds);
  } else if (req.user.role !== 'admin') {
    // 一般ユーザーは自分のログのみ
    query = query.eq('user_id', req.user.id);
  }
  const { data, error } = await query.range(Number(offset), Number(offset) + Number(limit) - 1);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// --- 操作ログCSVエクスポート ---
// GET /operation-logs/export
app.get('/operation-logs/export', authenticateToken, authorizeRole(['admin', 'user']), async (req, res) => {
  const { data, error } = await supabase
    .from('operation_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const fields = ['id', 'user_id', 'username', 'role', 'operation', 'target_type', 'target_id', 'detail', 'created_at'];
  const parser = new Json2csvParser({ fields, defaultValue: '' });
  const csv = parser.parse(data || []);
  res.header('Content-Type', 'text/csv');
  res.attachment('operation_logs.csv');
  res.send(csv);
});

// --- 在庫増減履歴取得 ---
// GET /items/:id/history
app.get('/items/:id/history', authenticateToken, async (req, res) => {
  const { id } = req.params;
  // サーバー側でuser_id→ユーザー名へマッピングして返す
  // 1. 履歴データ取得
  const { data: history, error: historyError } = await supabase
    .from('items_history')
    .select('*')
    .eq('item_id', id)
    .order('created_at', { ascending: false });
  if (historyError) return res.status(500).json({ error: historyError.message });
  // 2. 全ユーザー取得（name, username両方取得。usernameが無い場合も考慮）
  let profiles = [], profilesError = null;
  try {
    const resProfiles = await supabase.from('profiles').select('id, name');
    profiles = resProfiles.data || [];
    profilesError = resProfiles.error;
  } catch (e) {
    profiles = [];
    profilesError = e;
  }
  // id→nameマッピング
  const idToUser = Object.fromEntries((profiles || []).map(p => [p.id, { name: p.name }]));
  // 3. user_id→name→username→user_idの順でuser_nameを決定
  const result = (history || []).map(row => {
    const user = idToUser[row.user_id];
    return {
      ...row,
      user_name: (user && user.name) ? user.name : row.user_id
    };
  });
  res.json({ data: result });
});


// --- 在庫増減履歴・日次集計API ---
// GET /items-history/analytics?months=3
app.get('/items-history/analytics', authenticateToken, async (req, res) => {
  const months = Number(req.query.months) || 3;
  const now = new Date();
  // 3ヶ月前の1日から今日まで
  const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  // Supabase/Postgres: 日単位でgroup by, アイテムごとに集計
  // SQL例: SELECT item_id, date_trunc('day', created_at)::date AS date, SUM(change) AS total_change FROM items_history WHERE created_at >= ... GROUP BY item_id, date ORDER BY date ASC
  const { data, error } = await supabase.rpc('items_history_daily_analytics', {
    from_date: from.toISOString(),
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

app.listen(port, () => {
  console.log(`API server listening at http://localhost:${port}`);
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Supabase Service Role Key:', SUPABASE_SERVICE_ROLE_KEY ? '[set]' : '[not set]');
  console.log('JWT_SECRET:', JWT_SECRET ? '[set]' : '[not set]');
});

// --- 在庫アイテム（items）CRUD --- 
// 一覧取得（adminは全件、userは自分のuser_idのみ）
app.get('/items', authenticateToken, async (req, res) => {
  let query = supabase.from('items').select('*').eq('is_deleted', false);
  if (req.user.role === 'admin') {
    // 全件
  } else if (req.user.role === 'branch_admin' || req.user.role === 'user') {
    // 自分の支店の全ユーザーのuser_idを取得
    const { data: profile, error: profileError } = await supabase.from('profiles').select('branch_id').eq('id', req.user.id).single();
    if (profileError || !profile) return res.status(500).json({ error: '支店情報取得失敗' });
    const { data: users, error: usersError } = await supabase.from('profiles').select('id').eq('branch_id', profile.branch_id);
    if (usersError) return res.status(500).json({ error: 'ユーザー一覧取得失敗' });
    const userIds = users.map(u => u.id);
    query = query.in('user_id', userIds);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 追加（adminのみ）
app.post('/items', authenticateToken, authorizeRole(['admin', 'user']), async (req, res) => {
  const { name, unit, price, stock, threshold, user_id, branch_id } = req.body;
  // バリデーション: name必須, unit必須, price=半角数字4桁以内/整数/日本円, stock=整数, threshold=整数
  if (!name || !unit) return res.status(400).json({ error: 'name, unitは必須です' });
  if (!/^[0-9]{1,4}$/.test(String(price))) return res.status(400).json({ error: 'priceは半角数字4桁以内の整数（日本円）で入力してください' });
  if (!Number.isInteger(stock)) return res.status(400).json({ error: 'stockは整数で入力してください' });
  if (!Number.isInteger(threshold)) return res.status(400).json({ error: 'thresholdは整数で入力してください' });
  const { data, error } = await supabase.from('items').insert([{ name, unit, price, stock, threshold, user_id, branch_id, is_deleted: false }]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 編集（adminのみ）
app.put('/items/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, unit, price, stock, threshold } = req.body;
  if (!name || !unit) return res.status(400).json({ error: 'name, unitは必須です' });
  if (!/^[0-9]{1,4}$/.test(String(price))) return res.status(400).json({ error: 'priceは半角数字4桁以内の整数（日本円）で入力してください' });
  if (!Number.isInteger(stock)) return res.status(400).json({ error: 'stockは整数で入力してください' });
  if (!Number.isInteger(threshold)) return res.status(400).json({ error: 'thresholdは整数で入力してください' });
  const { data, error } = await supabase.from('items').update({ name, unit, price, stock, threshold }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// 論理削除（adminのみ）
app.delete('/items/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('items').update({ is_deleted: true }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

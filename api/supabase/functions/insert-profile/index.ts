// ユーザーサインアップ時にprofilesテーブルへ自動insertするSupabase Edge Function
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// 修正後（Deno用URLインポート）
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 環境変数から取得（Supabaseの管理画面で設定してください）
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  try {
    // Database Webhookのペイロード形式に対応
    const payload = await req.json();
    // INSERTイベント時のみ処理
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.record) {
      const user = payload.record;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from('profiles').insert([
        {
          id: user.id,
          name: user.raw_user_meta_data?.full_name || "未登録",
          role: "user",
          branch_id: null,
          created_at: new Date().toISOString(),
        }
      ]);
    }
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Error: ' + (e?.message || e), { status: 500 });
  }
});

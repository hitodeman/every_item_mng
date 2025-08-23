import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// app_metadata を更新する関数
async function setUserClaims(userId: string, role: "admin" | "branch_admin" | "user", branchId?: string) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role,
      ...(branchId ? { branch_id: branchId } : {}),
    },
  });
  if (error) throw error;
}

serve(async (req) => {
  try {
    const payload = await req.json();

    // auth.users の INSERT イベント時のみ処理
    if (payload.type === "INSERT" && payload.table === "users" && payload.record) {
      const user = payload.record;

      // profiles にINSERT
      const { error: insertError } = await supabaseAdmin.from("profiles").insert([
        {
          id: user.id,
          name: user.raw_user_meta_data?.full_name || "未登録",
          role: "user",      // 初期値は必ず user
          branch_id: null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      // JWT にも user を付与
      await setUserClaims(user.id, "admin");
    }

    return new Response("OK", { status: 200 });
  } catch (e) {
    return new Response("Error: " + (e?.message || e), { status: 500 });
  }
});

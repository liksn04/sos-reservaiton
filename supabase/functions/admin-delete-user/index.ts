import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. 호출자 인증 ─────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: '인증 정보가 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '유효하지 않은 세션입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 2. 관리자 권한 확인 ────────────────────────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: adminProfile } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 3. 요청 body 파싱 ──────────────────────────────────────
    const { targetUserId, targetName } = await req.json().catch(() => ({}));
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'targetUserId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 자기 자신 삭제 금지
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: '본인 계정은 삭제할 수 없습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 4. 감사 로그 적재 ──────────────────────────────────────
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    await admin.from('admin_action_log').insert({
      admin_id:    user.id,
      admin_name:  callerProfile?.display_name ?? null,
      target_id:   targetUserId,
      target_name: targetName ?? null,
      action:      'delete',
    });

    // ── 5. 스토리지 정리 ──────────────────────────────────────
    const { data: files } = await admin.storage
      .from('avatars')
      .list(targetUserId, { limit: 100 });

    if (files && files.length > 0) {
      const paths = files.map((f) => `${targetUserId}/${f.name}`);
      await admin.storage.from('avatars').remove(paths);
    }

    // ── 6. auth.users 삭제 (CASCADE 실행) ─────────────────────
    const { error: deleteError } = await admin.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: '삭제에 실패했습니다.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

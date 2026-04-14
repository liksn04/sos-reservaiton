// @ts-ignore: Deno runtime module imports are not recognized by standard Node TypeScript settings
import { createClient } from 'npm:@supabase/supabase-js@2';

// Deno is implicitly provided in Edge Functions.
declare const Deno: any;

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. 호출자 인증 ────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증 정보가 없습니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 세션입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. 요청 body 파싱 (탈퇴 사유, 선택) ─────────────────────
    let reason: string | null = null;
    try {
      const body = await req.json();
      reason = body?.reason ?? null;
    } catch { /* body 없음 — 무시 */ }

    // ── 3. Service Role 클라이언트 (admin 작업용) ────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. 탈퇴 로그 적재 ────────────────────────────────────────
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch error during deletion:', profileError);
    }

    const { error: logError } = await admin.from('account_deletion_log').insert({
      user_email:   user.email ?? null,
      display_name: profile?.display_name ?? null,
      reason,
    });
    
    if (logError) {
      console.warn('Account deletion log insert error:', logError);
    }

    // ── 5. 스토리지 아바타 정리 ──────────────────────────────────
    // avatars 버킷에 업로드된 파일 목록을 가져와 전부 삭제
    const { data: files, error: filesError } = await admin.storage
      .from('avatars')
      .list(user.id, { limit: 100 });

    if (filesError) {
      console.warn('Avatar list fetch error:', filesError);
    } else if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${user.id}/${f.name}`);
      const { error: removeError } = await admin.storage.from('avatars').remove(paths);
      if (removeError) {
        console.warn('Avatar remove error:', removeError);
      }
    }

    // ── 6. auth.users 삭제 ────────────────────────────────────────
    // ON DELETE CASCADE → profiles → reservations → reservation_invitees 자동 삭제
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('deleteUser error:', deleteError);
      return new Response(
        JSON.stringify({ error: `계정 삭제 실패: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: `서버 내부 오류: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

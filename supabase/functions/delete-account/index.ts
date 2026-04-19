// @ts-expect-error: Supabase Edge Functions resolve npm: imports in the Deno runtime.
import { createClient } from 'npm:@supabase/supabase-js@2';

interface DenoEnv {
  get(name: string): string | undefined;
}

interface DenoGlobal {
  env: DenoEnv;
  serve(handler: (req: Request) => Response | Promise<Response>): void;
}

interface DeleteAccountRequestBody {
  reason?: unknown;
}

interface StorageObject {
  name: string;
}

declare const Deno: DenoGlobal;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

const MAX_REASON_LENGTH = 500;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} 환경 변수가 설정되지 않았습니다.`);
  }

  return value;
}

function normalizeReason(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function parseDeleteAccountReason(
  req: Request,
): Promise<{ reason: string | null; errorResponse?: Response }> {
  const rawBody = await req.text();

  // Edge case: body가 비어 있으면 선택 입력으로 간주하고 null로 처리합니다.
  if (rawBody.trim().length === 0) {
    return { reason: null };
  }

  let body: DeleteAccountRequestBody;
  try {
    body = JSON.parse(rawBody) as DeleteAccountRequestBody;
  } catch {
    // Edge case: 잘못된 JSON 본문은 400으로 거절해 예측 불가능한 payload를 막습니다.
    return {
      reason: null,
      errorResponse: jsonResponse({ error: '요청 본문이 올바른 JSON 형식이 아닙니다.' }, 400),
    };
  }

  if (body.reason == null) {
    return { reason: null };
  }

  // Edge case: reason이 문자열이 아닌 경우 DB에 비정상 값이 들어가지 않게 차단합니다.
  if (typeof body.reason !== 'string') {
    return {
      reason: null,
      errorResponse: jsonResponse({ error: '탈퇴 사유는 문자열이어야 합니다.' }, 400),
    };
  }

  const normalizedReason = normalizeReason(body.reason);
  if (!normalizedReason) {
    return { reason: null };
  }

  // Edge case: 과도하게 긴 입력은 로그/DB 저장 전에 잘라내지 않고 명시적으로 거절합니다.
  if (normalizedReason.length > MAX_REASON_LENGTH) {
    return {
      reason: null,
      errorResponse: jsonResponse(
        { error: `탈퇴 사유는 ${MAX_REASON_LENGTH}자 이하여야 합니다.` },
        400,
      ),
    };
  }

  return { reason: normalizedReason };
}

const SUPABASE_URL = getRequiredEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getRequiredEnv('SUPABASE_ANON_KEY');
const SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. 호출자 인증 ────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: '인증 정보가 없습니다.' }, 401);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: '유효하지 않은 세션입니다.' }, 401);
    }

    // ── 2. 요청 body 파싱 (탈퇴 사유, 선택) ─────────────────────
    const { reason, errorResponse } = await parseDeleteAccountReason(req);
    if (errorResponse) {
      return errorResponse;
    }

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
      const paths = (files as StorageObject[]).map((file) => `${user.id}/${file.name}`);
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
      return jsonResponse({ error: `계정 삭제 실패: ${deleteError.message}` }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error('Unexpected error:', error);
    return jsonResponse(
      { error: `서버 내부 오류: ${error instanceof Error ? error.message : String(error)}` },
      500,
    );
  }
});

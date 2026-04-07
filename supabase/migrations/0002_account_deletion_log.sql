-- ============================================================
-- 회원 탈퇴 감사 로그 (account_deletion_log)
-- 탈퇴된 계정 정보를 익명 보존 목적으로 기록
-- ============================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email   TEXT,
  display_name TEXT,
  deleted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason       TEXT
);

-- 관리자만 조회 가능 (일반 유저는 접근 불가)
ALTER TABLE public.account_deletion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deletion_log_admin_only"
  ON public.account_deletion_log FOR SELECT
  USING ((SELECT public.is_admin_user()));

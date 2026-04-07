-- ============================================================
-- 어드민 기능 — banned 상태 + 차단 메타데이터 + 관리 로그
-- ============================================================

-- 1. profiles.status 체크 제약에 'banned' 추가
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'banned'));

-- 2. 차단 메타데이터 컬럼 추가
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_by     UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. 어드민 액션 감사 로그
CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_name  TEXT,
  target_id   UUID,
  target_name TEXT,
  action      TEXT        NOT NULL
                CHECK (action IN ('approve','reject','ban','unban','promote','demote','delete')),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;

-- 어드민만 조회/삽입 가능
CREATE POLICY "admin_log_select"
  ON public.admin_action_log FOR SELECT
  USING ((SELECT public.is_admin_user()));

CREATE POLICY "admin_log_insert"
  ON public.admin_action_log FOR INSERT
  WITH CHECK ((SELECT public.is_admin_user()));

-- 4. banned 유저가 예약 데이터를 읽지 못하도록 RLS 강화
-- (is_approved() 함수는 status = 'approved'만 통과하므로 banned는 이미 차단됨)
-- 기존 정책이 is_approved()를 사용하고 있으므로 추가 변경 불필요.

-- 5. (선택) 어드민 전용 전체 유저 조회 정책
-- 기존 profiles_select_all 정책이 is_admin_user()를 허용하므로 그대로 사용 가능.

-- ============================================================
-- Supabase Realtime (WebSocket) 초기화 스크립트
-- ============================================================

-- 1. 기존 Realtime Publication(출판) 삭제를 통해 복제 슬롯 연결을 강제 초기화합니다.
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 2. 새롭게 Realtime Publication을 생성합니다.
CREATE PUBLICATION supabase_realtime;

-- 3. 실시간 동기화가 필요한 모든 테이블을 다시 등록합니다.
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservation_invitees;

ALTER PUBLICATION supabase_realtime ADD TABLE public.club_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_participants;

ALTER PUBLICATION supabase_realtime ADD TABLE public.budget_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_fee_policies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.membership_fee_records;

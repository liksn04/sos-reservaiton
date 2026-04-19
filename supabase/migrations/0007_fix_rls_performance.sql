-- ============================================================
-- RLS 성능 최적화 및 중복 정책 정리 (Fix)
-- 기존의 비효율적인 정책들을 최적화된 정책으로 대체합니다.
-- ============================================================

-- 1. event_categories
DROP POLICY IF EXISTS "event_categories: approved can read" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories: admin can write" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_select" ON public.event_categories;
DROP POLICY IF EXISTS "event_categories_admin_all" ON public.event_categories;

CREATE POLICY "event_categories_select"
  ON public.event_categories FOR SELECT
  USING ((SELECT public.is_approved()) OR (SELECT public.is_admin_user()));

CREATE POLICY "event_categories_insert"
  ON public.event_categories FOR INSERT
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "event_categories_update"
  ON public.event_categories FOR UPDATE
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "event_categories_delete"
  ON public.event_categories FOR DELETE
  USING ((SELECT public.is_admin_user()));

-- 2. club_events
DROP POLICY IF EXISTS "club_events: approved can read public" ON public.club_events;
DROP POLICY IF EXISTS "club_events: admin can insert" ON public.club_events;
DROP POLICY IF EXISTS "club_events: admin can update" ON public.club_events;
DROP POLICY IF EXISTS "club_events: admin can delete" ON public.club_events;

CREATE POLICY "club_events: approved can read public"
  ON public.club_events FOR SELECT
  USING (
    (SELECT public.is_approved())
    AND (is_public = true OR created_by = (SELECT auth.uid())
         OR (SELECT public.is_admin_user()))
  );

CREATE POLICY "club_events: admin can insert"
  ON public.club_events FOR INSERT
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "club_events: admin can update"
  ON public.club_events FOR UPDATE
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "club_events: admin can delete"
  ON public.club_events FOR DELETE
  USING ((SELECT public.is_admin_user()));

-- 3. event_participants
DROP POLICY IF EXISTS "event_participants: can read own or admin" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants: can insert own" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants: can delete own or admin" ON public.event_participants;
DROP POLICY IF EXISTS "event_participants: admin can mark attended" ON public.event_participants;

CREATE POLICY "event_participants: can read own or admin"
  ON public.event_participants FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_user()));

CREATE POLICY "event_participants: can insert own"
  ON public.event_participants FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "event_participants: can delete own or admin"
  ON public.event_participants FOR DELETE
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_user()));

CREATE POLICY "event_participants: admin can mark attended"
  ON public.event_participants FOR UPDATE
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

-- 4. budget_categories
DROP POLICY IF EXISTS "budget_categories: approved can read" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories: admin can write" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_select" ON public.budget_categories;
DROP POLICY IF EXISTS "budget_categories_admin_all" ON public.budget_categories;

CREATE POLICY "budget_categories_select"
  ON public.budget_categories FOR SELECT
  USING ((SELECT public.is_approved()) OR (SELECT public.is_admin_user()));

CREATE POLICY "budget_categories_insert"
  ON public.budget_categories FOR INSERT
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "budget_categories_update"
  ON public.budget_categories FOR UPDATE
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "budget_categories_delete"
  ON public.budget_categories FOR DELETE
  USING ((SELECT public.is_admin_user()));

-- 5. budget_transactions
DROP POLICY IF EXISTS "budget_transactions: admin only" ON public.budget_transactions;

CREATE POLICY "budget_transactions: admin only"
  ON public.budget_transactions FOR ALL
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

-- 6. membership_fee_policies
DROP POLICY IF EXISTS "membership_fee_policies: admin only" ON public.membership_fee_policies;

CREATE POLICY "membership_fee_policies: admin only"
  ON public.membership_fee_policies FOR ALL
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

-- 7. membership_fee_records
DROP POLICY IF EXISTS "membership_fee_records: can read own or admin" ON public.membership_fee_records;
DROP POLICY IF EXISTS "membership_fee_records: admin can write" ON public.membership_fee_records;
DROP POLICY IF EXISTS "membership_fee_records_select" ON public.membership_fee_records;
DROP POLICY IF EXISTS "membership_fee_records_admin_manage" ON public.membership_fee_records;

CREATE POLICY "membership_fee_records_select"
  ON public.membership_fee_records FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin_user()));

CREATE POLICY "membership_fee_records_insert"
  ON public.membership_fee_records FOR INSERT
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "membership_fee_records_update"
  ON public.membership_fee_records FOR UPDATE
  USING ((SELECT public.is_admin_user()))
  WITH CHECK ((SELECT public.is_admin_user()));

CREATE POLICY "membership_fee_records_delete"
  ON public.membership_fee_records FOR DELETE
  USING ((SELECT public.is_admin_user()));

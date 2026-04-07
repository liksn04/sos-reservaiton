-- ════════════════════════════════════════════════════════════
-- 빛소리 — Budget Hub (Phase 1)
-- ════════════════════════════════════════════════════════════

-- ── 예산 카테고리 ────────────────────────────────────────────
create table public.budget_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  type        text not null check (type in ('income', 'expense')),
  icon        text not null default 'payments',
  color       text not null default '#6b7280',
  is_default  boolean not null default false,
  created_at  timestamptz default now()
);

-- 시드 데이터
insert into public.budget_categories (name, type, icon, color, is_default) values
  ('회비 수입',      'income',  'card_giftcard', '#10b981', true),
  ('기타 수입',      'income',  'savings',       '#3b82f6', false),
  ('동아리방 지출',  'expense', 'home',          '#ef4444', true),
  ('행사비',         'expense', 'celebration',   '#f59e0b', false),
  ('기자재',         'expense', 'shopping_bag',  '#a855f7', false),
  ('기타 지출',      'expense', 'payments',      '#6b7280', false);

-- ── 거래 내역 ────────────────────────────────────────────────
create table public.budget_transactions (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid references public.budget_categories(id) on delete set null,
  type            text not null check (type in ('income', 'expense')),
  amount          bigint not null,  -- 원 단위, 양수만
  description     text not null,
  transaction_date date not null,
  bank_account    text,             -- "국민은행 123-456"
  receipt_url     text,             -- 증명 파일 URL (Storage)
  fiscal_year     int not null,     -- 회계연도 (YYYY)
  fiscal_half     int not null check (fiscal_half in (1, 2)),  -- 1:상반기, 2:하반기
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now()
);

create index idx_budget_transactions_date on public.budget_transactions(transaction_date);
create index idx_budget_transactions_fiscal on public.budget_transactions(fiscal_year, fiscal_half);
create index idx_budget_transactions_type on public.budget_transactions(type);

-- ── 회비 정책 ────────────────────────────────────────────────
create table public.membership_fee_policies (
  id              uuid primary key default gen_random_uuid(),
  fiscal_year     int not null,
  fiscal_half     int not null check (fiscal_half in (1, 2)),
  amount          bigint not null,
  due_date        date,
  note            text,
  created_at      timestamptz default now(),

  unique(fiscal_year, fiscal_half)
);

-- ── 회비 납부 기록 ────────────────────────────────────────────
create table public.membership_fee_records (
  id              uuid primary key default gen_random_uuid(),
  policy_id       uuid not null references public.membership_fee_policies(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  paid_at         timestamptz,
  amount_paid     bigint,
  is_paid         boolean not null default false,
  note            text,

  unique(policy_id, user_id)
);

-- ── RLS ─────────────────────────────────────────────────────
alter table public.budget_categories enable row level security;
alter table public.budget_transactions enable row level security;
alter table public.membership_fee_policies enable row level security;
alter table public.membership_fee_records enable row level security;

-- budget_categories: approved 읽기, admin 쓰기
create policy "budget_categories: approved can read"
  on public.budget_categories for select
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and status = 'approved')
  );

create policy "budget_categories: admin can write"
  on public.budget_categories for all
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  );

-- budget_transactions: admin만
create policy "budget_transactions: admin only"
  on public.budget_transactions for all
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  );

-- membership_fee_policies: admin만
create policy "membership_fee_policies: admin only"
  on public.membership_fee_policies for all
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  );

-- membership_fee_records: 본인 읽기, admin 쓰기
create policy "membership_fee_records: can read own or admin"
  on public.membership_fee_records for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles
               where id = auth.uid() and is_admin = true)
  );

create policy "membership_fee_records: admin can write"
  on public.membership_fee_records for all
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  );

-- Realtime
alter publication supabase_realtime add table public.budget_transactions;
alter publication supabase_realtime add table public.membership_fee_policies;
alter publication supabase_realtime add table public.membership_fee_records;

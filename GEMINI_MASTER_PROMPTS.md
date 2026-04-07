# 빛소리 SoS — Gemini 3.1 Flash 마스터 프롬프트 모음

> **목적**: Gemini의 제한된 컨텍스트(~100K)에서 Events Hub Phase 2~4 + Budget Hub Phase 1~3을 단계별로 구현
>
> **규칙**: 각 프롬프트는 **독립적인 Gemini 세션**에서 실행. 이전 단계가 완료되어야 다음으로 진행.

---

## 📋 목차

1. [공통 컨텍스트 A](#프롬프트-a--공통-컨텍스트-모든-세션-시작-시)
2. [Events Hub Phase 2](#프롬프트-b--events-hub-phase-2-참가자-rsvp--출석)
3. [Events Hub Phase 3](#프롬프트-c--events-hub-phase-3-타임라인-뷰)
4. [Budget Hub Phase 1](#프롬프트-d--budget-hub-phase-1-db-스키마--기본-거래-화면)
5. [Budget Hub Phase 2](#프롬프트-e--budget-hub-phase-2-recharts-시각화--회비-관리)
6. [Budget Hub Phase 3](#프롬프트-f--budget-hub-phase-3-연도별-아카이브--admin-통합)
7. [실행 순서](#-사용-순서-요약)

---

## 프롬프트 A — 공통 컨텍스트 (모든 세션 시작 시)

**이 컨텍스트를 모든 Gemini 프롬프트 최상단에 붙여넣으세요.**

```markdown
# 빛소리(SoS) 동아리방 관리 앱 — 공통 컨텍스트

## 프로젝트 개요
- **스택**: Vite + React 18 + TypeScript + Supabase (Auth/Postgres/RLS/Realtime) + TailwindCSS v3
- **경로**: `/Users/[user]/Desktop/artifact/sos-reservation/`
- **언어**: 한국어 단일, 모바일 퍼스트 SPA
- **인증**: 카카오 OAuth → profile.status='approved'인 유저만 접근

## 핵심 아키텍처 규칙

### 1. 스타일 패턴
- **규칙**: 배경/테마 민감 요소는 반드시 `style={{ ... }}` + `var(--xxx)` 사용
- ❌ `bg-background` / `text-on-surface` Tailwind 클래스 (테마 전환 시 작동 X)
- ✅ `style={{ backgroundColor: 'var(--surface-container)' }}`
- 테마: `html.dark` / `html.light` 클래스 제어
- 주요 클래스 (index.css 정의):
  - 카드: `.glass-card`
  - 폼: `.form-group` (내부 input/select/textarea 자동)
  - 버튼: `.primary-btn`, `.secondary-btn`, `.reserve-now-btn`
  - 모달: `.modal-overlay.active`, `.modal-container`, `.modal-header`, `.modal-body`, `.modal-footer`
  - 제목: `.dashboard-title`, `.club-tag`, `.tab-content`, `.animate-slide-up`
  - 로딩: `.spinner`

### 2. 주요 CSS 변수
```
색상:
  --primary (파랑), --primary-btn-gradient, --primary-glow-shadow, --primary-border
배경:
  --bg-dark, --surface-container, --surface-container-high, --surface-highest
텍스트:
  --text-main, --text-muted, --text-on-surface-var
기타:
  --outline-border, --nav-bg, --nav-border, --error, --success, --club-tag-bg
```

### 3. 주요 라이브러리 및 import
```typescript
// Supabase
import { supabase } from '../lib/supabase'

// 인증
import { useAuth } from '../context/AuthContext'
// → { profile: Profile | null, loading: boolean, signOut: () => void }

// 테마
import { useTheme } from '../contexts/ThemeContext'
// → { resolvedTheme: 'light' | 'dark', toggleTheme: () => void }

// 쿼리/뮤테이션
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 라우팅
import { useNavigate, useParams, Link } from 'react-router-dom'

// 아이콘
// <span className="material-symbols-outlined">icon_name</span>
```

### 4. 쿼리 훅 패턴
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useSomething() {
  return useQuery({
    queryKey: ['something'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_name')
        .select('col1, col2, ...')
        .order('col', { ascending: true })
      if (error) throw error
      return data as SomeType[]
    },
  })
}
```

### 5. 뮤테이션 훅 패턴
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useDoSomething() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (input: InputType) => {
      // 권한 체크
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      // DB 작업
      const { data, error } = await supabase
        .from('table_name')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as OutputType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['something'] })
    },
  })
}
```

### 6. Realtime 구독 패턴 (훅 내)
```typescript
useEffect(() => {
  const channel = supabase.channel(`channel-name-${Math.random().toString(36).slice(2, 9)}`)
  channel
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'table_name' },
      () => {
        queryClient.invalidateQueries({ queryKey: ['something'] })
      }
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}, [queryClient])
```

### 7. form-group 스타일 (input 자동)
```html
<!-- input/select/textarea 자동으로 스타일됨 -->
<div className="form-group">
  <label>라벨</label>
  <input type="text" placeholder="입력" />
  <!-- ✅ 자동으로 높이 48px, 패딩, border, focus 처리됨 -->
</div>
```

## 현재 파일 구조

```
src/
├── App.tsx                      — 라우터 정의
├── types/index.ts              — 모든 인터페이스
├── lib/supabase.ts             — supabase client
├── context/AuthContext.tsx      — 인증 + profile
├── contexts/ThemeContext.tsx    — 다크/라이트 테마
├── hooks/
│   ├── useReservations.ts       — 예약 쿼리
│   ├── useMembers.ts            — 회원 쿼리
│   ├── useEvents.ts             — 일정 쿼리 (P1 완료)
│   ├── useEventCategories.ts    — 카테고리 (P1 완료)
│   ├── useEventParticipants.ts  — 참가자 (P2에서 작성)
│   ├── useBudget.ts             — 거래 쿼리 (P1에서 작성)
│   └── mutations/
│       ├── useEventMutations.ts
│       ├── useEventParticipantMutations.ts  (P2)
│       └── useBudgetMutations.ts            (P1)
├── routes/
│   ├── AppShell.tsx             — 공통 레이아웃 (BottomNav + Outlet)
│   ├── HomeRoute.tsx
│   ├── Reserve.tsx
│   ├── EventsRoute.tsx          — 일정 목록 (P1~3)
│   ├── BudgetRoute.tsx          — 예산 관리 (P1~3)
│   ├── ProfileRoute.tsx
│   └── Admin.tsx                — 관리자 패널
└── components/
    ├── BottomNav.tsx            — 홈/예약/일정/프로필 4탭
    ├── EventModal.tsx           — 일정 생성/수정 (P1)
    ├── EventParticipantsModal.tsx           (P2)
    ├── EventTimeline.tsx                    (P3)
    ├── BudgetCharts.tsx                     (P2)
    ├── MembershipFeePanel.tsx               (P2)
    ├── YearArchiveSelector.tsx              (P3)
    ├── ReservationModal/
    ├── Calendar/
    ├── DailySchedule/
    └── DashboardView.tsx
```

## 현재 DB 스키마 (Phase 1 완료)

```sql
-- 기존 테이블
profiles, reservations, reservation_invitees

-- Phase 1 추가됨
event_categories(id, name, color, icon, sort_order, created_at)
club_events(id, category_id, title, description, location,
            start_date, start_time, end_date, end_time,
            cover_image_url, is_public, created_by, created_at, updated_at)

-- Phase 2 추가됨 (이 프롬프트에서)
event_participants(id, event_id, user_id, attended, joined_at)

-- Phase 1 추가됨 (예산, 이 프롬프트 D에서)
budget_categories(id, name, type, icon, color, is_default, created_at)
budget_transactions(id, category_id, type, amount, description,
                    transaction_date, bank_account, receipt_url,
                    fiscal_year, fiscal_half, created_by, created_at)
membership_fee_policies(id, fiscal_year, fiscal_half, amount, due_date, note, created_at)
membership_fee_records(id, policy_id, user_id, paid_at, amount_paid,
                       is_paid, note)
```

## 현재 TypeScript 타입 (src/types/index.ts)

```typescript
// 기존
export interface Profile {
  id: string
  kakao_id: string | null
  display_name: string
  avatar_url: string | null
  part: Part[]
  bio: string | null
  status: ProfileStatus
  is_admin: boolean
  created_at: string
}

// 이벤트 (P1 완료)
export interface EventCategory {
  id: string
  name: string
  color: string      // hex
  icon: string       // material symbols
  sort_order: number
  created_at: string
}

export interface ClubEvent {
  id: string
  category_id: string | null
  title: string
  description: string | null
  location: string | null
  start_date: string      // YYYY-MM-DD
  start_time: string | null
  end_date: string | null
  end_time: string | null
  cover_image_url: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ClubEventWithDetails extends ClubEvent {
  category: EventCategory | null
  creator: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export interface ClubEventInput {
  category_id: string | null
  title: string
  description?: string | null
  location?: string | null
  start_date: string
  start_time?: string | null
  end_date?: string | null
  end_time?: string | null
  cover_image_url?: string | null
  is_public?: boolean
}
```

## 주의사항

1. **RLS 정책**: 모든 테이블에 명시적 정책 필수
   - approved 유저: select 권한
   - admin: insert/update/delete 권한 (통상)
2. **Realtime**: 각 훅에서 구독, cleanup에서 `removeChannel` 필수
3. **타입**: 모든 쿼리/뮤테이션 반환값에 `as Type[]` 또는 `.single() as Type` 붙이기
4. **에러 처리**: throw error → UI에서 catch → toast/alert
5. **기존 파일 참고**: useReservations.ts, useEventCategories.ts, useEventMutations.ts 패턴 따르기
```
```

---

## 프롬프트 B — Events Hub Phase 2: 참가자 RSVP + 출석

**[위의 공통 컨텍스트 A를 먼저 붙여넣기]**

```markdown
## 현재 작업: Events Hub Phase 2 — 참가자 RSVP + 출석 체크

### 구현할 기능
1. `event_participants` 테이블 (Supabase migration)
2. 일반 유저가 일정에 "참가" / "취소" 가능
3. 어드민이 참가자 목록 조회 + 출석 체크
4. EventsRoute.tsx 일정 카드에 "참가하기" 버튼
5. 어드민 전용 "참가자 목록" 모달

### 작성할 파일
1. **supabase/migrations/0005_event_participants.sql** — DB 스키마
2. **src/types/index.ts** 수정 — EventParticipant 타입 추가
3. **src/hooks/useEventParticipants.ts** — 참가자 쿼리
4. **src/hooks/mutations/useEventParticipantMutations.ts** — join/leave/mark attended
5. **src/components/EventParticipantsModal.tsx** — 참가자 목록 모달
6. **src/routes/EventsRoute.tsx** 수정 — 참가 버튼, 참가자 수

### 1️⃣ supabase/migrations/0005_event_participants.sql

```sql
-- 참가자 기록 테이블
create table public.event_participants (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.club_events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  attended    boolean not null default false,
  joined_at   timestamptz default now(),

  unique(event_id, user_id)
);

create index idx_event_participants_event on public.event_participants(event_id);
create index idx_event_participants_user on public.event_participants(user_id);

-- RLS
alter table public.event_participants enable row level security;

-- select: 본인 + 어드민
create policy "event_participants: can read own or admin"
  on public.event_participants for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles
               where id = auth.uid() and is_admin = true)
  );

-- insert: 본인만 참가
create policy "event_participants: can insert own"
  on public.event_participants for insert
  with check (user_id = auth.uid());

-- delete: 본인 취소 + 어드민 삭제
create policy "event_participants: can delete own or admin"
  on public.event_participants for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles
               where id = auth.uid() and is_admin = true)
  );

-- update(attended): 어드민만
create policy "event_participants: admin can mark attended"
  on public.event_participants for update
  using (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from public.profiles
            where id = auth.uid() and is_admin = true)
  );

-- Realtime
alter publication supabase_realtime add table public.event_participants;
```

### 2️⃣ src/types/index.ts 수정

기존 내용 유지 후 아래 추가:

```typescript
export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  attended: boolean
  joined_at: string
  profile?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'part'> | null
}
```

### 3️⃣ src/hooks/useEventParticipants.ts (새 파일)

```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { EventParticipant } from '../types'

export function useEventParticipants(eventId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['event_participants', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          user_id,
          attended,
          joined_at,
          profile:profiles(id, display_name, avatar_url, part)
        `)
        .eq('event_id', eventId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as unknown as EventParticipant[]
    },
    enabled: !!eventId,
  })

  useEffect(() => {
    if (!eventId) return
    const channel = supabase.channel(
      `event-participants-${eventId}-${Math.random().toString(36).slice(2, 9)}`
    )
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_participants', filter: `event_id=eq.${eventId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['event_participants', eventId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, queryClient])

  return query
}
```

### 4️⃣ src/hooks/mutations/useEventParticipantMutations.ts (새 파일)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export function useJoinEvent() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!profile?.id) throw new Error('로그인 필요')

      const { data, error } = await supabase
        .from('event_participants')
        .insert({ event_id: eventId, user_id: profile.id })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('이미 참가했습니다.')
        throw error
      }
      return data
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event_participants', eventId] })
    },
  })
}

export function useLeaveEvent() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!profile?.id) throw new Error('로그인 필요')
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', profile.id)

      if (error) throw error
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event_participants', eventId] })
    },
  })
}

export function useMarkAttended() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ participantId, attended }: { participantId: string; attended: boolean }) => {
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      const { error } = await supabase
        .from('event_participants')
        .update({ attended })
        .eq('id', participantId)

      if (error) throw error
    },
    onSuccess: (_, { participantId }) => {
      // participantId에서 eventId 가져올 수 없으므로 모든 참가자 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['event_participants'] })
    },
  })
}
```

### 5️⃣ src/components/EventParticipantsModal.tsx (새 파일)

```typescript
import { useAuth } from '../context/AuthContext'
import { useEventParticipants } from '../hooks/useEventParticipants'
import { useMarkAttended } from '../hooks/mutations/useEventParticipantMutations'
import type { ClubEventWithDetails } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  event: ClubEventWithDetails | null
}

const PART_COLORS: Record<string, string> = {
  vocal: '#ec4899',
  guitar: '#3b82f6',
  drum: '#f59e0b',
  bass: '#10b981',
  keyboard: '#a855f7',
}

export default function EventParticipantsModal({ isOpen, onClose, event }: Props) {
  const { profile } = useAuth()
  const { data: participants = [] } = useEventParticipants(event?.id ?? '')
  const markAttended = useMarkAttended()

  if (!isOpen || !event) return null

  const attended = participants.filter((p) => p.attended).length

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="text-2xl font-black italic">
            참가자 <span className="text-primary">{participants.length}명</span>
          </h2>
          <button
            className="material-symbols-outlined text-on-surface-variant"
            onClick={onClose}
            style={{ fontSize: '24px' }}
          >
            close
          </button>
        </div>

        <div className="modal-body">
          {/* 출석 통계 */}
          <div className="flex gap-2 mb-4">
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: 'var(--surface-container)' }}
            >
              <p className="text-xs text-muted font-bold uppercase">참가</p>
              <p className="text-2xl font-black italic mt-1">{participants.length}</p>
            </div>
            <div
              className="flex-1 rounded-xl p-3 text-center"
              style={{ backgroundColor: 'var(--surface-container)' }}
            >
              <p className="text-xs text-muted font-bold uppercase">출석</p>
              <p className="text-2xl font-black italic mt-1" style={{ color: 'var(--primary)' }}>
                {attended}
              </p>
            </div>
          </div>

          {/* 참가자 목록 */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-center text-muted text-sm py-8">참가자가 없습니다.</p>
            ) : (
              participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-container)' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {p.profile?.avatar_url && (
                      <img
                        src={p.profile.avatar_url}
                        alt={p.profile?.display_name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{p.profile?.display_name}</p>
                      {p.profile?.part && p.profile.part.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {p.profile.part.map((part: string) => (
                            <span
                              key={part}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ backgroundColor: PART_COLORS[part] ?? 'var(--text-muted)' }}
                            >
                              {part.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 출석 토글 (어드민만) */}
                  {profile?.is_admin && (
                    <button
                      onClick={() =>
                        markAttended.mutate({
                          participantId: p.id,
                          attended: !p.attended,
                        })
                      }
                      disabled={markAttended.isPending}
                      className="ml-2 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: p.attended ? 'var(--primary)' : 'var(--surface-container-high)',
                        color: p.attended ? '#fff' : 'var(--text-muted)',
                        border: `2px solid ${p.attended ? 'var(--primary)' : 'var(--outline-border)'}`,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                        {p.attended ? 'check_circle' : 'circle'}
                      </span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="secondary-btn w-full">
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
```

### 6️⃣ src/routes/EventsRoute.tsx 수정

기존 EventsRoute.tsx에서:

1. **import 추가**:
```typescript
import { useJoinEvent, useLeaveEvent } from '../hooks/mutations/useEventParticipantMutations'
import { useEventParticipants } from '../hooks/useEventParticipants'
import EventParticipantsModal from '../components/EventParticipantsModal'
```

2. **상태 추가** (return 전):
```typescript
const joinEvent = useJoinEvent()
const leaveEvent = useLeaveEvent()

const [participantsModalOpen, setParticipantsModalOpen] = useState(false)
const [selectedEventForParticipants, setSelectedEventForParticipants] = useState<ClubEventWithDetails | null>(null)

// 각 이벤트의 참가자 쿼리
const participantsByEvent = useMemo(() => {
  const map: Record<string, number> = {}
  sorted.forEach((ev) => {
    // useEventParticipants를 리스트에서는 사용할 수 없으므로
    // 대신 events에서 participant count를 서버에서 조회하는 것이 이상적
    // 임시로는 "로딩 중" 표시
  })
  return map
}, [sorted])
```

3. **일정 카드 내 참가 버튼 추가** (glass-card 안, 액션 버튼 앞):
```typescript
{/* 참가자 수 + 참가 버튼 */}
<div className="mt-3 flex items-center gap-2">
  <button
    onClick={() => {
      setSelectedEventForParticipants(ev)
      setParticipantsModalOpen(true)
    }}
    className="text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-full"
    style={{ backgroundColor: 'var(--club-tag-bg)', color: 'var(--primary)' }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '2px' }}>
      group
    </span>
    {/* 참가자 수는 useEventParticipants로 별도 조회 필요 */}
    N명
  </button>

  <button
    onClick={() => joinEvent.mutate(ev.id)}
    disabled={joinEvent.isPending || leaveEvent.isPending}
    className="flex-1 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all"
    style={{
      backgroundColor: 'var(--primary)',
      color: '#fff',
      opacity: joinEvent.isPending ? 0.6 : 1,
    }}
  >
    {joinEvent.isPending ? '참가 중...' : '참가하기'}
  </button>
</div>
```

4. **모달 추가** (return 최하단):
```typescript
<EventParticipantsModal
  isOpen={participantsModalOpen}
  onClose={() => setParticipantsModalOpen(false)}
  event={selectedEventForParticipants}
/>
```

### 검수 체크리스트
- [ ] 0005 migration 실행 완료 (Supabase Studio)
- [ ] types/index.ts에 EventParticipant 추가
- [ ] useEventParticipants.ts 생성 + Realtime 구독 확인
- [ ] useEventParticipantMutations.ts 생성 + 권한 체크
- [ ] EventParticipantsModal.tsx 생성 + PART_COLORS 포함
- [ ] EventsRoute.tsx 수정 + 참가 버튼 렌더링
- [ ] npm run dev → 일정에 "참가하기" 버튼 표시 + 클릭 시 참가자 목록 모달 열림
- [ ] 어드민 계정으로 참가자 출석 토글 가능
```
```

---

## 프롬프트 C — Events Hub Phase 3: 타임라인 뷰

**[위의 공통 컨텍스트 A를 먼저 붙여넣기]**

```markdown
## 현재 작업: Events Hub Phase 3 — 타임라인 뷰 + 연도 필터

### 이미 완료된 것
- EventsRoute.tsx: 다가오는/지난 탭, 카테고리 필터 (P1)
- 참가자 RSVP + 출석 (P2)

### 구현할 기능
1. EventsRoute에 "타임라인" 탭 추가 (3탭: 다가오는/지난/타임라인)
2. 타임라인: 연도별 그룹핑, 세로 선, 카테고리별 컬러 점
3. 연도 필터 칩: 상단에서 연도 선택 (2024/2025/2026...)
4. 타임라인은 모든 과거+미래 이벤트 표시

### 작성할 파일
1. **src/components/EventTimeline.tsx** — 타임라인 컴포넌트
2. **src/routes/EventsRoute.tsx** 수정 — 탭 추가, 타임라인 임포트

### 1️⃣ src/components/EventTimeline.tsx (새 파일)

```typescript
import { useMemo, useState } from 'react'
import type { ClubEventWithDetails } from '../types'

interface Props {
  events: ClubEventWithDetails[]
  isAdmin: boolean
  onEdit: (ev: ClubEventWithDetails) => void
  onDelete: (ev: ClubEventWithDetails) => void
}

function formatKDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default function EventTimeline({ events, isAdmin, onEdit, onDelete }: Props) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  // 연도 목록
  const years = useMemo(() => {
    const yearSet = new Set<number>()
    events.forEach((ev) => {
      const y = new Date(ev.start_date + 'T00:00:00').getFullYear()
      yearSet.add(y)
    })
    return Array.from(yearSet).sort((a, b) => b - a)
  }, [events])

  // 선택된 연도 (기본값: 최신)
  const activeYear = selectedYear ?? years[0] ?? new Date().getFullYear()

  // 연도별 그룹화
  const grouped = useMemo(() => {
    const map: Record<number, ClubEventWithDetails[]> = {}
    events.forEach((ev) => {
      const y = new Date(ev.start_date + 'T00:00:00').getFullYear()
      if (!map[y]) map[y] = []
      map[y].push(ev)
    })
    Object.keys(map).forEach((y) => {
      map[parseInt(y)].sort((a, b) => {
        const dc = a.start_date.localeCompare(b.start_date)
        return dc !== 0 ? dc : (a.start_time ?? '').localeCompare(b.start_time ?? '')
      })
    })
    return map
  }, [events])

  const timelineEvents = grouped[activeYear] ?? []

  return (
    <div>
      {/* 연도 필터 */}
      {years.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {years.map((y) => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest transition-all"
              style={{
                backgroundColor: activeYear === y ? 'var(--primary)' : 'var(--surface-container)',
                color: activeYear === y ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${activeYear === y ? 'var(--primary)' : 'var(--outline-border)'}`,
              }}
            >
              {y}년
            </button>
          ))}
        </div>
      )}

      {/* 타임라인 */}
      <div className="relative">
        {timelineEvents.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">
              event_busy
            </span>
            <p className="text-on-surface-variant font-bold">{activeYear}년 일정이 없습니다.</p>
          </div>
        ) : (
          <div className="relative ml-4 border-l" style={{ borderColor: 'var(--outline-border)', paddingLeft: '1.5rem' }}>
            {timelineEvents.map((ev, idx) => {
              const cat = ev.category
              return (
                <div key={ev.id} className="relative mb-6 pb-6">
                  {/* 점 */}
                  <div
                    className="absolute -left-[27px] w-3 h-3 rounded-full transition-all hover:scale-125"
                    style={{ backgroundColor: cat?.color ?? 'var(--primary)' }}
                  />

                  {/* 날짜 */}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                    {formatKDate(ev.start_date)}
                  </p>

                  {/* 카드 */}
                  <div
                    className="glass-card rounded-2xl p-4 border transition-all"
                    style={{
                      borderColor: cat?.color ?? 'var(--outline-border)',
                      backgroundColor: cat ? `${cat.color}0D` : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* 카테고리 배지 */}
                      {cat && (
                        <span
                          className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                            {cat.icon}
                          </span>
                          {cat.name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-black italic tracking-tight mt-2">{ev.title}</h3>

                    {ev.location && (
                      <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mt-1.5">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          place
                        </span>
                        {ev.location}
                      </p>
                    )}

                    {ev.description && (
                      <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{ev.description}</p>
                    )}

                    {/* 액션 */}
                    {isAdmin && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => onEdit(ev)}
                          className="flex-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: 'var(--surface-container)', color: 'var(--text-muted)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            settings
                          </span>
                          수정
                        </button>
                        <button
                          onClick={() => onDelete(ev)}
                          className="flex-1 text-[10px] font-black uppercase px-2 py-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: 'var(--surface-container)', color: 'var(--error)' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            delete
                          </span>
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 2️⃣ src/routes/EventsRoute.tsx 수정

기존 EventsRoute.tsx에서:

1. **import 추가**:
```typescript
import EventTimeline from '../components/EventTimeline'
```

2. **탭 타입 변경**:
```typescript
type Tab = 'upcoming' | 'past' | 'timeline'  // 'timeline' 추가
```

3. **탭 렌더링 수정**:
```typescript
{(['upcoming', 'past', 'timeline'] as Tab[]).map((t) => (
  <button key={t} onClick={() => setTab(t)} className="relative pb-3 px-1">
    <span
      className="text-lg font-black italic transition-colors"
      style={{ color: tab === t ? 'var(--primary)' : 'var(--text-muted)' }}
    >
      {t === 'upcoming' ? '다가오는 일정' : t === 'past' ? '지난 일정' : '타임라인'}
    </span>
    {tab === t && (
      <div
        className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg"
        style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
      />
    )}
  </button>
))}
```

4. **필터링 로직 수정**:
```typescript
const filtered = useMemo(() => {
  return events
    .filter((e) => (filterCategory ? e.category_id === filterCategory : true))
    .filter((e) => {
      const lastDay = e.end_date ?? e.start_date
      if (tab === 'timeline') return true  // 타임라인은 전체
      return tab === 'upcoming' ? lastDay >= today : lastDay < today
    })
}, [events, filterCategory, tab, today])
```

5. **렌더링 부분 수정**:
```typescript
{tab === 'timeline' ? (
  <EventTimeline
    events={filtered}
    isAdmin={isAdmin}
    onEdit={openEdit}
    onDelete={handleDelete}
  />
) : (
  /* 기존 카드 리스트 코드 */
  <div className="space-y-4">
    {/* ... */}
  </div>
)}
```

### 검수 체크리스트
- [ ] EventTimeline.tsx 생성
- [ ] EventsRoute.tsx 탭 추가 (3개: 다가오는/지난/타임라인)
- [ ] 타임라인 탭 클릭 시 연도별 필터 표시
- [ ] 연도 칩으로 연도 변경 가능
- [ ] 세로 타임라인 선 + 카테고리 컬러 점 렌더링
- [ ] 어드민 계정에서 타임라인 카드의 수정/삭제 버튼 표시
```
```

---

## 프롬프트 D — Budget Hub Phase 1: DB 스키마 + 기본 거래 화면

**[위의 공통 컨텍스트 A를 먼저 붙여넣기]**

```markdown
## 현재 작업: Budget Hub Phase 1 — DB 설계 + 거래 등록/조회

### 비즈니스 규칙
- 회비 정책: 반기제 (상반기 1/중반기 2, 연 2회)
- 예산 조회: 어드민만 가능
- 모든 거래: 계좌이체 기반 (현금 없음)
- 연도별 아카이브 지원

### 작성할 파일
1. **supabase/migrations/0006_budget_hub.sql** — DB 스키마
2. **src/types/index.ts** 수정 — Budget 관련 타입
3. **src/hooks/useBudgetTransactions.ts** — 거래 쿼리
4. **src/hooks/useBudgetCategories.ts** — 카테고리 쿼리
5. **src/hooks/mutations/useBudgetMutations.ts** — CRUD
6. **src/routes/BudgetRoute.tsx** — 어드민 라우트
7. **src/App.tsx** 수정 — /budget 라우트 + RequireAdmin 가드
8. **src/routes/Admin.tsx** 수정 — 예산관리 링크

### 1️⃣ supabase/migrations/0006_budget_hub.sql

```sql
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
```

### 2️⃣ src/types/index.ts 수정

```typescript
// 기존 코드 유지 후 추가

export interface BudgetCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  is_default: boolean
  created_at: string
}

export interface BudgetTransaction {
  id: string
  category_id: string | null
  type: 'income' | 'expense'
  amount: number
  description: string
  transaction_date: string  // YYYY-MM-DD
  bank_account: string | null
  receipt_url: string | null
  fiscal_year: number
  fiscal_half: 1 | 2
  created_by: string | null
  created_at: string
  category?: BudgetCategory | null
  creator?: Pick<Profile, 'id' | 'display_name'> | null
}

export interface MembershipFeePolicy {
  id: string
  fiscal_year: number
  fiscal_half: 1 | 2
  amount: number
  due_date: string | null
  note: string | null
  created_at: string
}

export interface MembershipFeeRecord {
  id: string
  policy_id: string
  user_id: string
  paid_at: string | null
  amount_paid: number | null
  is_paid: boolean
  note: string | null
  profile?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export interface BudgetTransactionInput {
  category_id: string | null
  type: 'income' | 'expense'
  amount: number
  description: string
  transaction_date: string
  bank_account?: string | null
  receipt_url?: string | null
  fiscal_year: number
  fiscal_half: 1 | 2
}
```

### 3️⃣ src/hooks/useBudgetTransactions.ts (새 파일)

```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { BudgetTransaction } from '../types'

export function useBudgetTransactions(fiscalYear?: number, fiscalHalf?: 1 | 2) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['budget_transactions', fiscalYear, fiscalHalf],
    queryFn: async () => {
      let q = supabase
        .from('budget_transactions')
        .select(`
          id,
          category_id,
          type,
          amount,
          description,
          transaction_date,
          bank_account,
          receipt_url,
          fiscal_year,
          fiscal_half,
          created_by,
          created_at,
          category:budget_categories(id, name, type, icon, color, is_default),
          creator:profiles!created_by(id, display_name)
        `)

      if (fiscalYear) q = q.eq('fiscal_year', fiscalYear)
      if (fiscalHalf) q = q.eq('fiscal_half', fiscalHalf)

      q = q.order('transaction_date', { ascending: false })

      const { data, error } = await q

      if (error) throw error
      return (data ?? []) as unknown as BudgetTransaction[]
    },
  })

  useEffect(() => {
    const channel = supabase.channel(
      `budget-transactions-${fiscalYear}-${fiscalHalf}-${Math.random().toString(36).slice(2, 9)}`
    )
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budget_transactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['budget_transactions', fiscalYear, fiscalHalf] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fiscalYear, fiscalHalf, queryClient])

  return query
}
```

### 4️⃣ src/hooks/useBudgetCategories.ts (새 파일)

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { BudgetCategory } from '../types'

export function useBudgetCategories() {
  return useQuery({
    queryKey: ['budget_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as BudgetCategory[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
```

### 5️⃣ src/hooks/mutations/useBudgetMutations.ts (새 파일)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import type { BudgetTransactionInput } from '../../types'

export function useCreateBudgetTransaction() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (input: BudgetTransactionInput) => {
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      const payload = {
        ...input,
        created_by: profile.id,
      }

      const { data, error } = await supabase
        .from('budget_transactions')
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_transactions'] })
    },
  })
}

export function useUpdateBudgetTransaction() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<BudgetTransactionInput>
    }) => {
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      const { data, error } = await supabase
        .from('budget_transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_transactions'] })
    },
  })
}

export function useDeleteBudgetTransaction() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      const { error } = await supabase.from('budget_transactions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_transactions'] })
    },
  })
}
```

### 6️⃣ src/routes/BudgetRoute.tsx (새 파일)

```typescript
import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBudgetTransactions } from '../hooks/useBudgetTransactions'
import { useBudgetCategories } from '../hooks/useBudgetCategories'
import { useDeleteBudgetTransaction } from '../hooks/mutations/useBudgetMutations'

type TransactionType = 'all' | 'income' | 'expense'

export default function BudgetRoute() {
  const { profile } = useAuth()
  const { data: transactions = [], isLoading } = useBudgetTransactions()
  const { data: categories = [] } = useBudgetCategories()
  const deleteTransaction = useDeleteBudgetTransaction()

  const [tab, setTab] = useState<TransactionType>('all')
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear())
  const [fiscalHalf, setFiscalHalf] = useState<1 | 2>(1)

  // 어드민 체크
  if (!profile?.is_admin) {
    return (
      <div className="tab-content animate-slide-up flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-error mb-4 block">
            lock
          </span>
          <p className="text-on-surface-variant font-bold">관리자만 접근 가능합니다.</p>
        </div>
      </div>
    )
  }

  // 필터링
  const filtered = useMemo(() => {
    return transactions
      .filter((t) =>
        tab === 'all' ? true : t.type === tab
      )
      .filter((t) => t.fiscal_year === fiscalYear && t.fiscal_half === fiscalHalf)
  }, [transactions, tab, fiscalYear, fiscalHalf])

  // 통계
  const stats = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [filtered])

  async function handleDelete(id: string) {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return
    try {
      await deleteTransaction.mutateAsync(id)
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    }
  }

  const halfLabel = fiscalHalf === 1 ? '상반기' : '하반기'

  return (
    <div className="tab-content animate-slide-up">
      {/* 헤더 */}
      <section className="mb-8">
        <div className="club-tag">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            account_balance_wallet
          </span>
          예산 관리
        </div>
        <h2 className="dashboard-title italic">
          <span className="text-gradient-white-purple">재정</span><br />
          <span>투명하게 관리하기</span>
        </h2>
        <p className="dashboard-subtitle">
          모든 수입/지출을 기록하고<br />동아리 재정 상태를 한눈에 파악하세요.
        </p>
      </section>

      {/* 연도/반기 필터 */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {[2024, 2025, 2026].map((year) => (
          <div key={year}>
            {[1, 2].map((half) => (
              <button
                key={`${year}-${half}`}
                onClick={() => {
                  setFiscalYear(year)
                  setFiscalHalf(half as 1 | 2)
                }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all"
                style={{
                  backgroundColor:
                    fiscalYear === year && fiscalHalf === half
                      ? 'var(--primary)'
                      : 'var(--surface-container)',
                  color:
                    fiscalYear === year && fiscalHalf === half
                      ? '#fff'
                      : 'var(--text-muted)',
                  border: `1px solid ${
                    fiscalYear === year && fiscalHalf === half
                      ? 'var(--primary)'
                      : 'var(--outline-border)'
                  }`,
                  marginRight: half === 1 ? '4px' : 0,
                }}
              >
                {year}년 {half === 1 ? '상반' : '하반'}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--primary-border)' }}>
          <p className="text-[9px] font-bold uppercase text-on-surface-variant">수입</p>
          <p className="text-lg font-black italic mt-1" style={{ color: '#10b981' }}>
            {(stats.income / 10000).toFixed(0)}만
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--outline-border)' }}>
          <p className="text-[9px] font-bold uppercase text-on-surface-variant">지출</p>
          <p className="text-lg font-black italic mt-1" style={{ color: 'var(--error)' }}>
            {(stats.expense / 10000).toFixed(0)}만
          </p>
        </div>
        <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--primary-border)' }}>
          <p className="text-[9px] font-bold uppercase text-on-surface-variant">잉여</p>
          <p className="text-lg font-black italic mt-1" style={{ color: stats.balance >= 0 ? '#10b981' : 'var(--error)' }}>
            {(stats.balance / 10000).toFixed(0)}만
          </p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--outline-border)' }}>
        {(['all', 'income', 'expense'] as TransactionType[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="relative pb-3 px-1">
            <span
              className="text-lg font-black italic transition-colors"
              style={{ color: tab === t ? 'var(--primary)' : 'var(--text-muted)' }}
            >
              {t === 'all' ? '전체' : t === 'income' ? '수입' : '지출'}
            </span>
            {tab === t && (
              <div
                className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg"
                style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* 거래 리스트 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="glass-card rounded-2xl p-10 flex justify-center">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-[48px] text-surface-variant mb-4">
              receipt_long
            </span>
            <p className="text-on-surface-variant font-bold">거래 내역이 없습니다.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className="glass-card rounded-xl p-4 flex items-center justify-between border"
              style={{
                borderColor: t.category?.color ?? 'var(--outline-border)',
                backgroundColor: t.category ? `${t.category.color}0D` : undefined,
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: t.category?.color ?? 'var(--surface-container)' }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: t.category ? '#fff' : 'var(--text-muted)' }}
                  >
                    {t.category?.icon ?? 'payments'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-sm">{t.description}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    • {t.category?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <div className="text-right">
                  <p
                    className="text-lg font-black italic"
                    style={{ color: t.type === 'income' ? '#10b981' : 'var(--error)' }}
                  >
                    {t.type === 'income' ? '+' : '-'}{(t.amount / 10000).toFixed(1)}만
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleteTransaction.isPending}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: 'var(--surface-container)', color: 'var(--text-muted)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    delete
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

### 7️⃣ src/App.tsx 수정

import 추가:
```typescript
import BudgetRoute from './routes/BudgetRoute'
```

Routes 내 RequireAdmin 가드 아래 추가:
```typescript
<Route element={<RequireAdmin />}>
  <Route path="admin" element={<Admin />} />
  <Route path="budget" element={<BudgetRoute />} />
</Route>
```

### 8️⃣ src/routes/Admin.tsx 수정

기존 카드 아래에 추가:
```typescript
<Link to="/budget" className="block">
  <div className="glass-card rounded-2xl p-6 border hover:border-primary transition-all hover:shadow-xl"
    style={{ borderColor: 'var(--outline-border)' }}>
    <span className="material-symbols-outlined text-[32px] mb-3 block" style={{ color: '#3b82f6' }}>
      account_balance_wallet
    </span>
    <h3 className="text-lg font-black italic mb-1">예산 관리</h3>
    <p className="text-sm text-on-surface-variant">거래 · 회비 · 차트</p>
  </div>
</Link>
```

### 검수 체크리스트
- [ ] 0006 migration 실행 (Supabase Studio)
- [ ] types/index.ts에 Budget 타입들 추가
- [ ] useBudgetTransactions.ts 생성
- [ ] useBudgetCategories.ts 생성
- [ ] useBudgetMutations.ts 생성
- [ ] BudgetRoute.tsx 생성 (어드민만 접근 가능)
- [ ] App.tsx /budget 라우트 + RequireAdmin 가드 추가
- [ ] Admin.tsx 예산관리 카드 추가
- [ ] npm run dev → 관리자 계정에서 Admin → "예산 관리" 링크 클릭 → BudgetRoute 렌더링
- [ ] 거래 목록 표시, 연도/반기 필터, 수입/지출/잉여 통계 표시
```
```

---

## 프롬프트 E — Budget Hub Phase 2: Recharts 시각화 + 회비 관리

**[위의 공통 컨텍스트 A를 먼저 붙여넣기]**

```markdown
## 현재 작업: Budget Hub Phase 2 — 차트 시각화 + 회비 납부 관리

### 이미 완료된 것
- Budget Hub Phase 1: DB 스키마, 거래 등록/조회

### 추가 설치
```bash
npm install recharts
```

### 작성할 파일
1. **src/components/BudgetCharts.tsx** — 3가지 차트
2. **src/components/MembershipFeePanel.tsx** — 회비 패널
3. **src/routes/BudgetRoute.tsx** 수정 — "차트" / "회비" 탭 추가

### 1️⃣ src/components/BudgetCharts.tsx (새 파일)

```typescript
import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import type { BudgetTransaction } from '../types'

interface Props {
  transactions: BudgetTransaction[]
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export default function BudgetCharts({ transactions }: Props) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const textColor = isDark ? 'var(--text-main)' : '#0F172A'
  const gridColor = isDark ? 'var(--outline-border)' : '#E2E8F0'
  const axisStyle = { fill: textColor, fontSize: 11 }

  // 월별 차트 데이터
  const monthlyData = useMemo(() => {
    const months: Record<number, { income: number; expense: number }> = {}
    transactions.forEach((t) => {
      const month = new Date(t.transaction_date + 'T00:00:00').getMonth() + 1
      if (!months[month]) months[month] = { income: 0, expense: 0 }
      if (t.type === 'income') months[month].income += t.amount
      else months[month].expense += t.amount
    })
    return MONTHS.map((label, idx) => ({
      name: label,
      수입: (months[idx + 1]?.income ?? 0) / 10000,
      지출: (months[idx + 1]?.expense ?? 0) / 10000,
    }))
  }, [transactions])

  // 카테고리별 지출 데이터
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> = {}
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category?.name ?? '기타'
        const color = t.category?.color ?? '#6b7280'
        if (!map[cat]) map[cat] = { name: cat, value: 0, color }
        map[cat].value += t.amount / 10000
      })
    return Object.values(map)
  }, [transactions])

  // 누적 잔액 데이터
  const cumulativeData = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )
    let balance = 0
    return sorted.map((t) => {
      balance += t.type === 'income' ? t.amount : -t.amount
      return {
        date: new Date(t.transaction_date + 'T00:00:00').toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        }),
        balance: balance / 10000,
      }
    })
  }, [transactions])

  const CustomTooltip = ({ active, payload }: any) =>
    active && payload?.length ? (
      <div
        className="rounded-lg p-2 text-xs font-bold"
        style={{
          background: 'var(--surface-container)',
          border: '1px solid var(--outline-border)',
          color: 'var(--text-main)',
        }}
      >
        <p>{payload[0].value.toLocaleString('ko-KR')}만원</p>
      </div>
    ) : null

  return (
    <div className="space-y-6">
      {/* 월별 수입/지출 */}
      <div className="glass-card rounded-2xl p-4 border" style={{ borderColor: 'var(--outline-border)' }}>
        <h3 className="text-sm font-black italic mb-3">월별 수입 · 지출</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={axisStyle} />
            <YAxis tick={axisStyle} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="수입" fill="#10b981" />
            <Bar dataKey="지출" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 카테고리별 지출 */}
      {expenseByCategory.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border" style={{ borderColor: 'var(--outline-border)' }}>
          <h3 className="text-sm font-black italic mb-3">카테고리별 지출</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie dataKey="value" data={expenseByCategory} cx="50%" cy="50%" outerRadius={60} label>
                {expenseByCategory.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1 text-xs">
            {expenseByCategory.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-bold">{cat.name}</span>
                </div>
                <span>{cat.value.toFixed(1)}만원</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 누적 잔액 */}
      {cumulativeData.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border" style={{ borderColor: 'var(--outline-border)' }}>
          <h3 className="text-sm font-black italic mb-3">누적 잔액 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" stroke="var(--primary)" fill="url(#colorBalance)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
```

### 2️⃣ src/components/MembershipFeePanel.tsx (새 파일)

```typescript
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useMarkMembershipPaid } from '../hooks/mutations/useBudgetMutations'
import type { MembershipFeePolicy, MembershipFeeRecord, Profile } from '../types'

interface Props {
  fiscalYear: number
  fiscalHalf: 1 | 2
}

export default function MembershipFeePanel({ fiscalYear, fiscalHalf }: Props) {
  const { profile } = useAuth()
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // 정책
  const { data: policy } = useQuery({
    queryKey: ['membership_fee_policy', fiscalYear, fiscalHalf],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_fee_policies')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('fiscal_half', fiscalHalf)
        .single()

      if (error?.code === 'PGRST116') return null
      if (error) throw error
      return data as MembershipFeePolicy
    },
  })

  // 납부 기록
  const { data: records = [] } = useQuery({
    queryKey: ['membership_fee_records', fiscalYear, fiscalHalf],
    queryFn: async () => {
      if (!policy?.id) return []
      const { data, error } = await supabase
        .from('membership_fee_records')
        .select(`
          id,
          policy_id,
          user_id,
          paid_at,
          amount_paid,
          is_paid,
          note,
          profile:profiles(id, display_name, avatar_url, part)
        `)
        .eq('policy_id', policy.id)
        .order('is_paid', { ascending: false })

      if (error) throw error
      return data as unknown as MembershipFeeRecord[]
    },
    enabled: !!policy?.id,
  })

  const markPaid = useMarkMembershipPaid()

  const stats = useMemo(() => {
    const paid = records.filter((r) => r.is_paid).length
    const total = records.length
    return { paid, total, unpaid: total - paid }
  }, [records])

  if (!policy) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center border" style={{ borderColor: 'var(--outline-border)' }}>
        <p className="text-on-surface-variant font-bold">
          {fiscalYear}년 {fiscalHalf === 1 ? '상반기' : '하반기'} 회비 정책이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 정책 */}
      <div className="glass-card rounded-2xl p-4 border" style={{ borderColor: 'var(--primary-border)' }}>
        <h3 className="text-sm font-black italic mb-3">회비 정책</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center">
            <p className="text-[9px] text-on-surface-variant font-bold uppercase">금액</p>
            <p className="text-xl font-black italic">{(policy.amount / 10000).toFixed(0)}만</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-on-surface-variant font-bold uppercase">마감</p>
            <p className="text-sm font-bold">
              {policy.due_date
                ? new Date(policy.due_date + 'T00:00:00').toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '미정'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-on-surface-variant font-bold uppercase">납부율</p>
            <p className="text-lg font-black italic" style={{ color: '#10b981' }}>
              {stats.total > 0 ? ((stats.paid / stats.total) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-lg p-3 text-center border" style={{ borderColor: 'var(--outline-border)' }}>
          <p className="text-[9px] font-bold uppercase text-on-surface-variant">전체</p>
          <p className="text-lg font-black italic mt-1">{stats.total}명</p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center border" style={{ borderColor: '#10b981' }}>
          <p className="text-[9px] font-bold uppercase" style={{ color: '#10b981' }}>납부</p>
          <p className="text-lg font-black italic mt-1" style={{ color: '#10b981' }}>
            {stats.paid}명
          </p>
        </div>
        <div className="glass-card rounded-lg p-3 text-center border" style={{ borderColor: 'var(--error)' }}>
          <p className="text-[9px] font-bold uppercase text-error">미납</p>
          <p className="text-lg font-black italic mt-1" style={{ color: 'var(--error)' }}>
            {stats.unpaid}명
          </p>
        </div>
      </div>

      {/* 부원 목록 */}
      <div className="glass-card rounded-2xl p-4 border" style={{ borderColor: 'var(--outline-border)' }}>
        <h3 className="text-sm font-black italic mb-3">납부 현황</h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-center text-sm text-on-surface-variant py-4">부원이 없습니다.</p>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--surface-container)' }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {r.profile?.avatar_url && (
                    <img
                      src={r.profile.avatar_url}
                      alt={r.profile?.display_name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate">{r.profile?.display_name}</p>
                    {r.profile?.part && r.profile.part.length > 0 && (
                      <p className="text-[9px] text-on-surface-variant">
                        {(r.profile.part as string[]).join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* 토글 (어드민) */}
                {profile?.is_admin && (
                  <button
                    onClick={() => markPaid.mutate({ recordId: r.id, isPaid: !r.is_paid })}
                    disabled={markPaid.isPending}
                    className="ml-2 w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      backgroundColor: r.is_paid ? '#10b981' : 'var(--surface-container-high)',
                      color: r.is_paid ? '#fff' : 'var(--text-muted)',
                      border: `2px solid ${r.is_paid ? '#10b981' : 'var(--outline-border)'}`,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {r.is_paid ? 'check_circle' : 'circle'}
                    </span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
```

### 3️⃣ src/hooks/mutations/useBudgetMutations.ts 추가

위에서 생성한 파일에 아래 함수 추가:

```typescript
export function useMarkMembershipPaid() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async ({ recordId, isPaid }: { recordId: string; isPaid: boolean }) => {
      if (!profile?.is_admin) throw new Error('관리자만 가능합니다.')

      const { error } = await supabase
        .from('membership_fee_records')
        .update({
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null,
        })
        .eq('id', recordId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership_fee_records'] })
    },
  })
}
```

### 4️⃣ src/routes/BudgetRoute.tsx 수정

import 추가:
```typescript
import BudgetCharts from '../components/BudgetCharts'
import MembershipFeePanel from '../components/MembershipFeePanel'
```

탭 타입 변경:
```typescript
type BudgetTab = 'transactions' | 'charts' | 'fees'
```

state 변경:
```typescript
const [budgetTab, setBudgetTab] = useState<BudgetTab>('transactions')
```

기존 탭 코드를 아래로 교체:
```typescript
<div className="flex gap-4 mb-6 border-b" style={{ borderColor: 'var(--outline-border)' }}>
  {(['transactions', 'charts', 'fees'] as BudgetTab[]).map((t) => (
    <button key={t} onClick={() => setBudgetTab(t)} className="relative pb-3 px-1">
      <span
        className="text-lg font-black italic transition-colors"
        style={{ color: budgetTab === t ? 'var(--primary)' : 'var(--text-muted)' }}
      >
        {t === 'transactions' ? '거래' : t === 'charts' ? '차트' : '회비'}
      </span>
      {budgetTab === t && (
        <div
          className="absolute bottom-0 left-0 w-full h-1 rounded-t-lg"
          style={{ background: 'var(--primary-btn-gradient)', boxShadow: 'var(--primary-glow-shadow)' }}
        />
      )}
    </button>
  ))}
</div>

{budgetTab === 'transactions' ? (
  /* 기존 거래 리스트 코드 */
  <div className="space-y-3">
    {/* ... */}
  </div>
) : budgetTab === 'charts' ? (
  <BudgetCharts transactions={filtered} />
) : (
  <MembershipFeePanel fiscalYear={fiscalYear} fiscalHalf={fiscalHalf} />
)}
```

### 검수 체크리스트
- [ ] recharts 설치 (npm install recharts)
- [ ] BudgetCharts.tsx 생성 (3개 차트)
- [ ] MembershipFeePanel.tsx 생성 (회비 패널)
- [ ] useBudgetMutations.ts에 useMarkMembershipPaid 추가
- [ ] BudgetRoute.tsx 탭 수정 (거래/차트/회비)
- [ ] npm run dev → 관리자 계정 → 예산관리 → "차트" 탭 클릭 → 3가지 차트 표시
- [ ] "회비" 탭 클릭 → 회비 정책 + 부원 납부 현황 표시
- [ ] 어드민이 부원의 납부 상태를 토글 가능
```
```

---

## 프롬프트 F — Budget Hub Phase 3: 연도별 아카이브 + Admin 통합

**[위의 공통 컨텍스트 A를 먼저 붙여넣기]**

```markdown
## 현재 작업: Budget Hub Phase 3 — 연도별 아카이브 + Admin 통합

### 이미 완료된 것
- Events Hub Phase 1~3 (일정, 참가자, 타임라인)
- Budget Hub Phase 1~2 (거래, 차트, 회비)

### 작성할 파일
1. **src/components/YearArchiveSelector.tsx** — 연도별 아카이브 선택기
2. **src/routes/BudgetRoute.tsx** 수정 — 연간 통계 추가
3. **src/routes/Admin.tsx** 수정 — "행사 관리" 링크 추가 (기존 "예산 관리"는 이미 추가됨)
4. (선택) **src/hooks/useBudgetStatsByYear.ts** — 연간 통계 쿼리

### 1️⃣ src/components/YearArchiveSelector.tsx (새 파일)

```typescript
interface Props {
  selectedYear: number
  availableYears: number[]
  onChange: (year: number) => void
}

export default function YearArchiveSelector({ selectedYear, availableYears, onChange }: Props) {
  if (availableYears.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {availableYears.map((year) => (
        <button
          key={year}
          onClick={() => onChange(year)}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest transition-all"
          style={{
            backgroundColor: selectedYear === year ? 'var(--primary)' : 'var(--surface-container)',
            color: selectedYear === year ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${selectedYear === year ? 'var(--primary)' : 'var(--outline-border)'}`,
          }}
        >
          {year}년
        </button>
      ))}
    </div>
  )
}
```

### 2️⃣ src/hooks/useBudgetStatsByYear.ts (새 파일)

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { BudgetTransaction } from '../types'

export function useBudgetStatsByYear(year: number) {
  return useQuery({
    queryKey: ['budget_stats_by_year', year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('fiscal_year', year)
        .order('transaction_date', { ascending: true })

      if (error) throw error

      const transactions = data as BudgetTransaction[]

      const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      return { income, expense, balance: income - expense, count: transactions.length }
    },
  })
}
```

### 3️⃣ src/routes/BudgetRoute.tsx 수정

import 추가:
```typescript
import YearArchiveSelector from '../components/YearArchiveSelector'
import { useBudgetStatsByYear } from '../hooks/useBudgetStatsByYear'
```

state 추가:
```typescript
const [archiveYear, setArchiveYear] = useState<number>(new Date().getFullYear())
```

연도 목록 계산 추가 (useMemo):
```typescript
const availableYears = useMemo(() => {
  const years = new Set<number>()
  transactions.forEach((t) => years.add(t.fiscal_year))
  return Array.from(years).sort((a, b) => b - a)
}, [transactions])
```

통계 쿼리 추가:
```typescript
const { data: yearStats } = useBudgetStatsByYear(archiveYear)
```

연도 필터 아래에 추가:
```typescript
{/* 연도별 아카이브 */}
<YearArchiveSelector
  selectedYear={archiveYear}
  availableYears={availableYears}
  onChange={setArchiveYear}
/>

{/* 연간 통계 */}
{yearStats && (
  <div className="grid grid-cols-3 gap-2 mb-6">
    <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--primary-border)' }}>
      <p className="text-[9px] font-bold uppercase text-on-surface-variant">{archiveYear}년 수입</p>
      <p className="text-xl font-black italic mt-1" style={{ color: '#10b981' }}>
        {(yearStats.income / 10000).toFixed(0)}만
      </p>
    </div>
    <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--outline-border)' }}>
      <p className="text-[9px] font-bold uppercase text-on-surface-variant">{archiveYear}년 지출</p>
      <p className="text-xl font-black italic mt-1" style={{ color: 'var(--error)' }}>
        {(yearStats.expense / 10000).toFixed(0)}만
      </p>
    </div>
    <div className="glass-card rounded-2xl p-3 text-center border" style={{ borderColor: 'var(--primary-border)' }}>
      <p className="text-[9px] font-bold uppercase text-on-surface-variant">{archiveYear}년 잉여</p>
      <p className="text-xl font-black italic mt-1" style={{ color: yearStats.balance >= 0 ? '#10b981' : 'var(--error)' }}>
        {(yearStats.balance / 10000).toFixed(0)}만
      </p>
    </div>
  </div>
)}
```

### 4️⃣ src/routes/Admin.tsx 수정

기존 "예산 관리" 카드 아래에 추가:

```typescript
<Link to="/events" className="block">
  <div className="glass-card rounded-2xl p-6 border hover:border-primary transition-all hover:shadow-xl"
    style={{ borderColor: 'var(--outline-border)' }}>
    <span className="material-symbols-outlined text-[32px] mb-3 block" style={{ color: '#a855f7' }}>
      calendar_month
    </span>
    <h3 className="text-lg font-black italic mb-1">행사 관리</h3>
    <p className="text-sm text-on-surface-variant">일정 등록 · 참가자 · 타임라인</p>
  </div>
</Link>
```

### 검수 체크리스트
- [ ] YearArchiveSelector.tsx 생성
- [ ] useBudgetStatsByYear.ts 생성
- [ ] BudgetRoute.tsx에 연도 아카이브 + 연간 통계 추가
- [ ] Admin.tsx에 "행사 관리" 카드 추가 (Events 링크)
- [ ] npm run dev → 관리자 → 예산관리 → 연도 선택 칩 표시
- [ ] 연도 변경 시 상단 통계 변경
- [ ] Admin 페이지 → "예산 관리" + "행사 관리" 2개 카드 표시
- [ ] 각 카드 클릭 시 해당 라우트로 이동 (BudgetRoute / EventsRoute)

### 최종 완성 체크리스트

#### 데이터베이스
- [ ] 0004_events_hub.sql 실행 ✅ (이미 완료)
- [ ] 0005_event_participants.sql 실행
- [ ] 0006_budget_hub.sql 실행

#### Events Hub (완성)
- [x] Phase 1 - 일정 CRUD (P1 완료)
- [ ] Phase 2 - 참가자 RSVP + 출석 (B에서 구현)
- [ ] Phase 3 - 타임라인 뷰 (C에서 구현)

#### Budget Hub (완성)
- [ ] Phase 1 - 거래 등록/조회 (D에서 구현)
- [ ] Phase 2 - Recharts 차트 + 회비 관리 (E에서 구현)
- [ ] Phase 3 - 연도별 아카이브 + Admin 통합 (F에서 구현)

#### UI 통합
- [ ] BottomNav: 홈/예약/일정/프로필 4탭 ✅
- [ ] App.tsx: 모든 라우트 연결 ✅
- [ ] Admin.tsx: 예산 + 행사 관리 카드 ✅

#### 추가 (이후 고려)
- 💾 이미지/영수증 업로드 (Supabase Storage)
- 📊 Excel/PDF 내보내기
- 📧 회비 미납 알림
- 🔔 이벤트 참가 알림
```
```

---

## 📊 사용 순서 요약

| 순서 | 프롬프트 | 산출물 | 파일 수 |
|---:|---|---|---:|
| **모든 세션** | **A** (공통 컨텍스트) | 필수 사전 복사 | — |
| **1** | **B** (참가자 RSVP) | Phase 2 완성 | 6개 |
| **2** | **C** (타임라인 뷰) | Phase 3 완성 | 2개 |
| **3** | **D** (예산 기본) | Phase 1 완성 | 8개 |
| **4** | **E** (차트 + 회비) | Phase 2 완성 | 4개 |
| **5** | **F** (아카이브 통합) | Phase 3 완성 | 4개 |
| **✅** | **완성** | 전체 시스템 | **24개** |

---

## 💡 Gemini 3.1 Flash 사용 팁

### 컨텍스트 절약 전략
1. **공통 컨텍스트 A를 매번 맨 앞에 복사** — 약 2~3K 토큰
2. **파일 내용은 필요할 때만 제공** — 기존 파일 수정 시 현재 내용 붙여넣기
3. **한 세션에 1~2개 프롬프트만 진행** — Phase 하나씩 (예: B → C → 새 세션)
4. **코드는 "생략 없이 전체" 요청** — `// ... existing code` 같은 최소화 X

### 에러 대응
- Gemini가 코드를 생략하면: **"생략 없이 완전한 코드를 작성해주세요"** 재요청
- 타입 에러: **현재 types/index.ts의 전체 내용** 복사 후 요청
- import 에러: **기존 파일 상단 10줄** (import문) 제공

### 빌드 및 배포
```bash
# 각 Phase 후
npm run build
npm run dev  # 로컬 테스트

# 마지막에
git add .
git commit -m "Events + Budget Hub 전체 완성"
vercel deploy  # 배포
```

---

## 🔐 보안 주의

- **민감한 데이터**: 모든 예산 조회 어드민 전용 ✅
- **RLS 정책**: 모든 테이블에 명시적 정책 필수 ✅
- **환경 변수**: Supabase URL/Key → `.env.local` (git ignore) ✅

---

이 마스터 프롬프트로 Gemini 3.1 Flash에서 **완전한 Events Hub + Budget Hub 시스템**을 단계별로 구축할 수 있습니다! 🚀

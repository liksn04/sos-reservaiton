# 📅 1. 일정 탭 (Events Hub)

---

## 컨셉 정리

기존 예약(reservations)은 **마이크로 일정**(짧고 자주 변동), 새 탭은 **매크로 일정**(분기/학기 단위 큰 행사). 두 시스템을 분리해야 하는 이유:

- 데이터 라이프사이클이 다름 (예약은 14일 후 정리, 행사는 영구 보존 + 아카이브)
- 리뷰/회고/사진/예산 연동 필요
- D-day 중심 vs 시간대 중심

## 데이터 모델 (`club_events` 테이블)

```sql
create table club_events (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,                    -- "2026 봄 정기공연"
  category        text not null,                    -- 'concert' | 'busking' | 'orientation' | 'mt' | 'workshop' | 'meeting' | 'etc'
  status          text not null default 'planning', -- 'planning' | 'confirmed' | 'ongoing' | 'done' | 'cancelled'
  start_date      date not null,
  end_date        date,                             -- null이면 단일 날짜
  start_time      time,                             -- 선택적 (시간 미정 가능)
  end_time        time,
  location        text,                             -- "홍대 클럽 FF"
  description     text,
  cover_image_url text,                             -- Storage 업로드
  organizer_id    uuid references profiles(id),     -- 담당자
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  -- 예산 연동
  budget_amount   numeric(12, 0),                   -- 책정 예산
  actual_amount   numeric(12, 0)                    -- 실제 사용 (budget_transactions에서 합산)
);

create table event_participants (
  event_id        uuid references club_events(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  role            text default 'attendee',          -- 'organizer' | 'staff' | 'performer' | 'attendee'
  rsvp_status     text default 'pending',           -- 'yes' | 'no' | 'maybe' | 'pending'
  primary key (event_id, user_id)
);

create table event_tasks (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid references club_events(id) on delete cascade,
  title           text not null,                    -- "포스터 인쇄"
  due_date        date,
  assignee_id     uuid references profiles(id),
  done            boolean default false,
  order_index     int default 0
);
```

## UI 구성안

### 메인 화면 — 3가지 뷰 토글

1. **카드 리스트** (기본): 곧 다가오는 행사 → 큰 D-day 카드 + 카테고리 색상 + 진행률 바
2. **타임라인 뷰**: 학기/연간 큰 그림 보기 (간트 차트 스타일)
3. **카테고리 뷰**: 정기공연/버스킹/회의 묶어서 보기

### 상세 페이지 구성

```
┌─────────────────────────┐
│  [커버 이미지]            │
│  D-23  • CONCERT         │
│  2026 봄 정기공연         │
│  📍 홍대 클럽 FF          │
├─────────────────────────┤
│  체크리스트 (3/8)         │  ← event_tasks
│  ☑ 장소 예약              │
│  ☑ 포스터 디자인          │
│  ☐ 음향 점검              │
├─────────────────────────┤
│  참가자 (12/15)           │  ← RSVP
│  👤👤👤 +9               │
├─────────────────────────┤
│  예산 280,000 / 500,000   │  ← 진행률 바
│  > 예산 상세 보기          │
└─────────────────────────┘
```

### 단계별 구현 (MVP → 확장)

- **Phase 1**: 행사 CRUD + 카드 리스트 + D-day + 카테고리 색상
- **Phase 2**: 체크리스트(event_tasks) + RSVP
- **Phase 3**: 예산 연동 + 사진 갤러리
- **Phase 4**: 타임라인 뷰 + 학기별 아카이브 + 회고록

---

# 💰 2. 예산 관리 체계 (Budget Hub — Admin Only)

## 벤치마킹: 비슷한 프로그램 6개 비교

| 프로그램 | 강점 | 약점 | 차용할 점 |
| --- | --- | --- | --- |
| **Splitwise** | 직관적 분담 UI, 모바일 최적 | 단일 그룹 외 약함, 보고서 빈약 | 거래 카드 디자인, 빠른 입력 UX |
| **Wave Accounting** | 무료 사업체 회계, 영수증 OCR, 대시보드 차트 | 너무 무거움, 한국 미지원 | 대시보드 위젯 구성, 카테고리 색상 시스템 |
| **YNAB (You Need A Budget)** | "봉투 예산" 철학, 카테고리별 한도 관리 | 학습곡선, 유료 | 카테고리별 잔여 예산 진행률 바 |
| **Toshl Finance** | 컬러풀한 카테고리, 차트 다양성 | 광고 많음 | 도넛/라인차트 조합 |
| **GnuCash** | 복식부기, 정확한 결산 | UX 구식 | 거래내역 검색/필터 |
| **Notion 가계부 템플릿** | 데이터베이스 + 보드/캘린더 뷰 변환 | 차트 빈약, 모바일 약함 | 뷰 전환 (테이블↔차트↔카테고리) |

### 한국 동아리 회계 실태 조사 (벤치마크용)

- 대부분 **엑셀**로 관리 (시트 분리, 매월 정산)
- **카카오뱅크 모임통장** + **외부 가계부** 조합이 많음
- "뱅크샐러드" 같은 자산관리 앱은 개인용이라 동아리에 부적합
- **회비 납부 현황**과 **거래 내역**이 분리되어 누락이 잦음

→ **우리만의 차별점**: 회비 납부(멤버 연동) + 거래 내역 + 행사 예산 연동을 한 곳에 통합

## 데이터 모델

```sql
-- 거래 카테고리 (어드민이 관리)
create table budget_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,                  -- "회비", "합주실료", "악기구입", "식비"
  type        text not null,                  -- 'income' | 'expense'
  color       text not null,                  -- '#3b82f6' (차트 색상)
  icon        text,                           -- material symbol name
  monthly_budget numeric(12, 0),              -- 카테고리별 월 한도 (선택)
  order_index int default 0,
  created_at  timestamptz default now()
);

-- 거래 내역
create table budget_transactions (
  id              uuid primary key default gen_random_uuid(),
  type            text not null,              -- 'income' | 'expense'
  amount          numeric(12, 0) not null,    -- 원화 정수
  category_id     uuid references budget_categories(id),
  date            date not null,
  title           text not null,              -- "4월 합주실료"
  memo            text,
  receipt_url     text,                       -- 영수증 사진 (Storage)
  related_event_id uuid references club_events(id), -- 행사 연동 (선택)
  related_user_id  uuid references profiles(id),    -- 회비 납부자 (선택)
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- 회비 정책 (학기/월 단위)
create table membership_fee_policies (
  id          uuid primary key default gen_random_uuid(),
  semester    text not null,                  -- "2026-1" (2026년 1학기)
  amount      numeric(12, 0) not null,        -- 1인당 금액
  due_date    date,
  created_at  timestamptz default now()
);

-- 회비 납부 현황
create table membership_fee_records (
  id              uuid primary key default gen_random_uuid(),
  policy_id       uuid references membership_fee_policies(id) on delete cascade,
  user_id         uuid references profiles(id) on delete cascade,
  paid            boolean default false,
  paid_at         date,
  transaction_id  uuid references budget_transactions(id), -- 거래 내역 자동 생성
  unique (policy_id, user_id)
);
```

## UI 구성안

### 어드민 대시보드 메인 화면

```
┌─────────────────────────────────┐
│  💰 동아리 회계                  │
│  ─────────────────────          │
│  현재 잔액                        │
│  ₩ 1,247,300                    │  ← 큰 숫자
│  ▲ 이번 달 +320,000              │
├─────────────────────────────────┤
│  [수입] 480,000  [지출] 160,000  │  ← 2개 카드
├─────────────────────────────────┤
│  📊 카테고리별 지출 (이번 달)     │
│  ⬤ 합주실료    52%               │  ← 도넛차트
│  ⬤ 식비        28%               │
│  ⬤ 악기구입    20%               │
├─────────────────────────────────┤
│  📈 최근 6개월 추이               │  ← 라인차트
│  [수입] —————                   │
│  [지출] - - - - -                │
├─────────────────────────────────┤
│  💳 최근 거래 5건                 │
│  - 4/5 합주실료     -120,000     │
│  - 4/3 회비 (김준모) +15,000     │
└─────────────────────────────────┘
```

### 핵심 화면 4개

1. **대시보드**: 잔액 + 차트 위젯
2. **거래 내역**: 검색/필터/정렬 가능한 리스트, 카테고리 색상 태그
3. **회비 관리**: 학기별 표 (멤버 × 납부여부 매트릭스)
4. **분석/리포트**: 월별/학기별/연도별 결산, PDF export

### 빠른 입력 UX (가장 중요)

- 하단 FAB(`+`) 한 번으로 거래 입력 모달
- 카테고리는 **이전 사용 빈도순** 정렬
- 영수증 사진을 먼저 찍으면 → 금액/날짜 입력 자동화 (Phase 2: OCR)
- 회비 입력 시 멤버 선택 → 자동 거래 + 납부 현황 동시 갱신

### 시각화 라이브러리

- **Recharts** (React 친화적, 가벼움, 무료) ← 추천
- 또는 **Chart.js** + react-chartjs-2

## 단계별 구현

### Phase 1 — 기본 회계 (1주)

- categories CRUD
- transactions CRUD + 영수증 업로드
- 잔액/이번달 수입·지출 카드
- 거래 내역 리스트 (필터: 카테고리, 기간, 타입)

### Phase 2 — 시각화 (3-4일)

- Recharts 도입
- 카테고리별 도넛차트
- 6개월 라인차트
- 카테고리별 예산 vs 실제 진행률 바

### Phase 3 — 회비 관리 (1주)

- membership_fee_policies / records 테이블
- 학기별 납부 매트릭스 UI
- 미납자 알림
- 거래 자동 생성

### Phase 4 — 행사 연동 + 리포트

- club_events ↔ budget_transactions 연결
- 행사별 예산 vs 실제 비교
- 학기 결산 PDF export
- CSV export

---

# 🗺️ 통합 로드맵 제안

```
M1 (4월) ─ 일정 탭 Phase 1 (행사 CRUD + D-day)
M2 (5월) ─ 예산 Phase 1 (기본 회계)
M3 (6월) ─ 예산 Phase 2 (차트) + 일정 Phase 2 (체크리스트)
M4 (7월) ─ 예산 Phase 3 (회비 관리)
M5 (8월) ─ 행사 ↔ 예산 통합 + 리포트
M6 (9월) ─ PWA 푸시 알림 + 회고/아카이브
```

---

# 🤔 결정이 필요한 것들

진행 전 확인하고 싶은 사항입니다:

1. **회비 정책**: 학기제(반기) vs 월납제 vs 둘 다 지원?
2. **권한**: 예산 "조회"는 모든 회원에게 공개? 어드민만?
3. **현금 vs 계좌**: 모임통장 잔액과 별도로 현금 함을 추적해야 하나요?
4. **다년도 데이터**: 졸업한 회원 거래 내역도 보존? 연도별 아카이브?
5. **차트 라이브러리**: Recharts(추천) vs Chart.js vs 직접 구현(SVG)?
6. **일정 카테고리**: 미리 고정값 vs 어드민이 자유롭게 추가?

→ 

1 : 회비정책은 반기제입니다.

2 : 예산의 조회는 어드민에게만 허용합니다.

3 : 모든 거래는 계좌로 이루어집니다.

4 : 연도별 아카이브가 좋겠습니다.?

5 : 추천을 따르겠습니다.

6 : 어드민이 자유롭게 추가하겠습니다.
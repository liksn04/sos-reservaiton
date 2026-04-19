# SOS Reservation 프로젝트 개요 보고서

작성일: 2026-04-20
대상 저장소: `sos-reservation`

## 1. 한눈에 보는 프로젝트

이 프로젝트는 단순한 예약 캘린더가 아니라, 대학 밴드 동아리 `빛소리`의 운영 업무를 모바일 중심으로 묶은 Supabase 기반 운영 SPA다. 핵심은 합주실 예약이지만, 실제 구현은 여기서 멈추지 않고 행사 관리, 회비/예산 관리, 관리자 패널, 계정 삭제와 차단 처리, PWA 오프라인 대응까지 포함한다.

현재 코드 기준 제품 정체성은 다음과 같다.

- 일반 부원: 합주실 예약, 행사 확인/참가, 프로필 관리
- 관리자: 회원 운영, 차단/권한 조정, 예약 정책 시즌 관리, 예산 관리
- 시스템 성격: "동아리방 예약 앱"보다 "동아리 운영 도구"에 가깝다

## 2. 제품 의도와 실제 구현 차이

### 문서가 말하는 의도

- 루트 `README.md`는 현재 워크트리에서 삭제되어 있으며, 마지막 커밋 기준 내용도 Vite 템플릿 수준이다.
- `New_Gev.md`는 Events Hub / Budget Hub 확장 설계를 담은 제품 메모다.
- `GEMINI_MASTER_PROMPTS.md`는 AI 세션 단위 구현 프롬프트 묶음으로, 기능 로드맵과 파일 구조 기대치를 보여준다.

### 코드가 보여주는 실제 상태

- 예약, 이벤트, 예산, 관리자 패널은 실제 구현되어 있다.
- RSVP, 출석 체크, 당일 예약 시즌, 계정 삭제 Edge Function까지 실제 코드가 존재한다.
- 반면 `New_Gev.md`에 적힌 체크리스트, 사진 갤러리, PDF export, 타임라인 고도화 같은 확장 항목은 일부만 구현됐다.
- 승인 대기 흐름은 최근 커밋에서 제거됐지만, 프론트에는 `/pending-approval` 잔재가 남아 있다.

정리하면, 이 저장소는 "기획 문서가 앞서 있었고 실제 구현이 그 일부를 따라온 상태"이며, 현재의 사실상 source of truth는 README가 아니라 `src/`와 `supabase/migrations/`다.

## 3. 저장소 성격과 파일 구조

이 저장소는 프론트엔드 SPA와 Supabase 백엔드를 같은 저장소에서 관리하는 단일 앱 구조다.

### 핵심 구현 디렉터리

- `src/`
  - 실제 프론트엔드 구현 중심
  - 약 96개 파일
- `supabase/`
  - 마이그레이션과 Edge Functions
  - 약 22개 파일
- `public/`
  - PWA 아이콘/정적 에셋

### 생성 산출물 / 리뷰 노이즈 가능 디렉터리

- `dist/`
  - Vite 빌드 결과물
- `coverage/`
  - Vitest coverage 산출물
- `node_modules/`
  - 의존성 설치 산출물

### 구조 해석

이 저장소는 `features/` 기반 도메인 분리 구조보다는 "라우트 + 훅 + 컴포넌트" 조합이 중심인 실전형 React 앱이다.

- `src/routes/`
  - 페이지 경계와 사용자 흐름
- `src/hooks/`
  - Supabase 쿼리/뮤테이션, React Query 캐시 무효화
- `src/components/`
  - 모달, 카드, 관리자 패널, 캘린더, 토스트 등 UI 조립
- `src/lib/`
  - Supabase client, RealtimeProvider, lazy module loader, query key
- `src/utils/`
  - 시간/예약 정책/검증 로직과 테스트

즉, 문서상으로는 확장형 운영 플랫폼처럼 보이지만, 실제 구조는 "모바일 퍼스트 앱을 빠르게 확장해 온 React 코드베이스"에 가깝다.

## 4. 사용 기술 스택

### 프론트엔드

- Vite 8
- React 19
- TypeScript 5
- React Router 7
- TanStack Query 5
- TailwindCSS 3
- Framer Motion
- Lucide React
- Recharts

### 백엔드 / 데이터

- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Supabase Storage
- Supabase Edge Functions
- RLS(Row Level Security) 기반 접근 제어

### 품질 / 도구

- ESLint 9
- Vitest 4
- `@vitest/coverage-v8`
- vite-plugin-pwa

## 5. 런타임 아키텍처

### 앱 부트스트랩

- 진입점은 `src/main.tsx`
- 실질 부트스트랩은 `src/App.tsx`
- Provider 순서는 `Theme -> Toast -> React Query -> Realtime -> Auth -> Router`

이 구조는 전역 상태를 최소화하고, 서버 상태는 React Query가, 인증은 AuthContext가, 실시간 갱신은 RealtimeProvider가 맡는 형태다.

### 라우팅 구조

실제 경로는 다음 성격으로 나뉜다.

- 공개/로그인: `/login`
- 인증 후 초기 설정: `/profile/setup`
- 차단 사용자: `/banned`
- 일반 앱 셸: `/`, `/reserve`, `/events`, `/profile`
- 관리자 전용: `/admin`, `/budget`

`AppShell`은 상단 바, 하단 네비게이션, 예약 모달을 공통으로 감싸며, 예약 작성/수정 액션을 Outlet context로 하위 라우트에 전달한다.

### 데이터 흐름

대부분의 읽기 흐름은 다음 패턴을 따른다.

1. `useQuery` 훅에서 Supabase 조회
2. `queryKeys`로 키 중앙 관리
3. 뮤테이션 성공 시 관련 키 무효화
4. `RealtimeProvider`가 주요 테이블 변경을 수신해 전역 invalidate

이 패턴은 `reservations`, `club_events`, `event_participants`, `budget_transactions`, `budget_categories` 전반에 적용된다.

### 코드 스플리팅

- `src/lib/moduleLoaders.ts`에서 라우트와 일부 탭을 lazy import
- 예산 차트와 관리자 탭은 idle prefetch를 사용
- `vite.config.ts`는 `react`, `supabase`, `query`, `charts`, `motion` vendor chunk를 수동 분리

즉, 모바일 체감 성능과 초기 로딩량을 의식한 구조가 일부 반영되어 있다.

## 6. 핵심 도메인 모델

### 1. 회원/권한

`profiles`

- 카카오 로그인 기반 프로필
- `status`, `is_admin`, `banned_*` 메타데이터 보유
- 관리자 액션 로그와 차단 상태를 지원

### 2. 합주실 예약

`reservations`, `reservation_invitees`

- 날짜/시작/종료/익일 여부/팀명/인원/목적 관리
- 예약 목적은 `합주`, `강습`, `정기회의`
- 초대자 모델로 합주 참여 인원을 연결

### 3. 당일 예약 정책

`reservation_policy_seasons`

- 특정 시즌에만 당일 합주 예약을 예외 허용
- 프론트 유효성 검증 + DB trigger로 이중 방어

### 4. 행사 허브

`event_categories`, `club_events`, `event_participants`

- 카테고리형 행사
- RSVP/출석 체크
- 타임라인/카드 뷰 혼합

### 5. 예산 허브

`budget_categories`, `budget_transactions`, `membership_fee_policies`, `membership_fee_records`

- 수입/지출 카테고리
- 학기 단위 거래 내역
- 회비 정책과 납부 현황
- 관리자 전용 재정 화면

## 7. 핵심 기능 정리

### 예약

- 월간 캘린더 기반 예약 조회
- 날짜별 일정 리스트
- 예약 생성/수정/삭제
- 초대 인원 관리
- 과거 날짜/과거 시작 시각/겹침/합주 당일 규칙 검증

### 이벤트

- 다가오는 일정 / 지난 일정 / 타임라인 탭
- 관리자 행사 등록/수정/삭제
- 참가 신청 및 취소
- 참석 여부 표시

### 관리자

- 회원 검색
- 관리자 권한 부여/해제
- 차단/차단 해제
- 관리자 계정 삭제
- 예약 정책 시즌 관리
- 감사 로그 조회

### 예산

- 거래 등록/수정/삭제
- 카테고리 관리
- 차트 기반 요약
- 회비 정책/납부 현황 UI

### 운영 편의

- PWA 설치/업데이트 프롬프트
- 오프라인 배너
- 테마 전환
- 계정 삭제 Edge Function
- 관리자 접속 시 14일 초과 예약 자동 정리

## 8. 보안, 권한, 운영 구조

### 보안적으로 잘 잡힌 부분

- 핵심 데이터는 Supabase RLS로 보호된다.
- `is_approved()`, `is_admin_user()` 같은 DB 함수로 정책을 재사용한다.
- 계정 삭제와 관리자 강제 삭제는 Edge Function + service role로 분리되어 있다.
- 당일 예약 정책은 프론트 유효성 검증만이 아니라 DB trigger까지 포함한다.
- 이벤트/예산/관리 로그는 관리자 권한 중심으로 분리돼 있다.

### 운영 구조상 눈에 띄는 특징

- `handle_new_user()` 트리거가 Auth 가입 직후 profile row를 자동 생성한다.
- 최신 마이그레이션에서 기본 상태는 `approved`로 전환되었다.
- `useAutoCleanup()`가 관리자 접속 시 오래된 예약을 프론트에서 정리한다.
- PWA는 auto-update 전략과 Supabase API `NetworkFirst` 캐시를 사용한다.

### 코드 기준으로 보이는 보안/운영상 빈틈

- `src/lib/supabase.ts`는 환경 변수 존재 여부를 런타임에서 검증하지 않는다.
- Edge Function CORS가 `*`로 열려 있다. 인증이 있어 완전 무방비는 아니지만, 운영 정책 관점에서는 더 좁힐 수 있다.
- 명시적 rate limiting, abuse protection, 감사 이벤트 집계 같은 운영 장치는 저장소에서 확인되지 않는다.
- 관리자 자동 정리 로직이 DB 스케줄이 아니라 클라이언트 로그인 시점에 의존한다.

## 9. 시행착오와 진화 과정

최근 커밋 흐름은 이 저장소가 어떤 문제와 싸워 왔는지 잘 보여준다.

- `feat(auth): remove admin approval logic and set default status to approved`
- `fix(auth): delete account logic and IDE type errors`
- `feat: 예약 정책 시즌 추가`
- `feat: refresh UI and tighten reservation guards`
- `feat: 글로벌 토스트 시스템 구축 및 다크 모드 버튼 시인성 개선`
- `feat: redesign admin UI, add back button, and implement full admin reservation control`
- `UI 현대화 및 로고 디자인 고도화 완료`

이 흐름을 종합하면 최근의 주요 고통 지점은 아래와 같다.

- 승인 기반 가입 흐름을 단순화하는 인증 정책 전환
- 계정 삭제와 관리자 계정 삭제의 정리 로직
- 예약 규칙 강화와 당일 예약 예외 처리
- 관리자 운영 툴 확장
- 모바일 UI와 시각적 리브랜딩

`New_Gev.md`와 `GEMINI_MASTER_PROMPTS.md`까지 보면, 이 프로젝트는 구현과 동시에 AI 기반 설계/작업 분할을 적극 사용해 왔다. 다만 이 과정에서 일부 오래된 설계와 현재 코드 사이에 드리프트가 남았다.

## 10. 현재 품질 상태

2026-04-20 기준으로 실제 명령을 실행해 확인한 결과는 다음과 같다.

### `npm run test`

- 결과: 성공
- 세부: 테스트 파일 2개, 테스트 19개 전부 통과
- 해석: 핵심 유틸 검증은 존재하지만 범위가 매우 좁다

### `npm run test:coverage`

- 결과: 성공
- 요약:
  - Statements 86.97%
  - Branches 82.80%
  - Functions 97.05%
  - Lines 95.59%
- 해석: 수치만 보면 80%를 넘지만, 실제 커버 대상이 `src/utils/time.ts`, `src/utils/reservationPolicy.ts`, `src/utils/validation.ts` 중심이라 앱 전체 건강도를 대변하지는 못한다

### `npm run lint`

- 결과: 실패
- 원인 요약:
  - `src/components/DeleteAccountDialog.tsx`: `any` 사용
  - `supabase/functions/delete-account/index.ts`: `@ts-ignore`, `any` 사용
- 해석: 현재 품질 게이트는 테스트/빌드는 통과하지만 린트 기준선은 깨져 있다

### `npm run build`

- 결과: 성공
- 세부:
  - TypeScript 빌드 포함 통과
  - PWA 산출물 생성 성공
  - 큰 청크는 `charts-vendor` 약 397.49 kB
- 해석: 배포 가능 번들은 생성되지만, 차트 번들은 여전히 비교적 무겁다

## 11. 현재 건강 상태에 대한 실제 해석

이 저장소의 현재 건강 상태는 "겉으로는 빌드 가능하지만, 내부적으로는 몇 개의 기능 드리프트를 안고 있는 상태"에 가깝다.

### 건강한 부분

- 예약 도메인은 비교적 단단하다
- React Query + Realtime 패턴이 일관적이다
- Supabase RLS와 trigger 설계가 꽤 잘 되어 있다
- 모바일 앱처럼 보이는 UX 완성도가 높다

### 주의가 필요한 부분

- 린트 실패가 남아 있다
- README가 부재하고 공식 문서가 실제 구현을 대표하지 못한다
- 승인 제거 이후 남은 라우팅 잔재가 존재한다
- 회비 관리 코드는 현재 스키마와 맞지 않는 흔적이 있다

## 12. 구조적 드리프트와 기술 부채

### 1. 승인 대기 흐름 잔재

최근 마이그레이션은 `profiles.status` 기본값을 `approved`로 돌렸지만, 프론트에는 `/pending-approval`로 이동하는 코드가 남아 있다.

- `src/routes/Login.tsx`
- `src/routes/ProfileSetup.tsx`

이 경로는 실제 라우터에 등록되어 있지 않으므로, 상태 조합에 따라 오래된 흐름이 재노출될 여지가 있다.

### 2. 회비 관리 기능의 스키마 드리프트

`useMembershipFees.ts`와 `useBudgetMutations.ts`의 일부 쿼리는 현재 타입/마이그레이션과 맞지 않는다.

예시:

- `profiles`에서 `full_name`, `session`, `role`, `is_approved`를 조회
- `membership_fee_records`에서 `fiscal_year`, `fiscal_half`로 조회/삽입

하지만 현재 타입과 마이그레이션 기준으로는:

- `profiles`에는 `display_name`, `part`, `status`가 중심
- `membership_fee_records`는 `policy_id` 기반 구조

즉, 예산 허브의 회비 패널은 런타임에서 실제 오류가 날 가능성이 높다.

### 3. 이벤트 참가자 표시와 RLS의 긴장

`event_participants`의 select 정책은 본인 또는 관리자만 읽게 되어 있는데, 이벤트 화면은 참가자 수와 목록을 일반 사용자에게도 보여주려는 UI를 가진다.

이 경우 일반 사용자는 전체 참가자 수가 아니라 "내가 볼 수 있는 참가자"만 보게 될 가능성이 있다. 즉, UI 의도와 RLS 정책이 완전히 정렬되어 있지 않다.

### 4. 자동 정리 책임 위치

오래된 예약 정리는 현재 DB cron/job이 아니라 프론트의 `useAutoCleanup()`에 실려 있다. 관리자 로그인 없이 장기간 방치되면 데이터 정리가 지연될 수 있다.

## 13. 다음 정리 순서 권장안

우선순위는 다음 순서를 권장한다.

1. 문서 기준선 복구
   - 최소한 README를 실제 프로젝트 설명으로 교체
   - 이 overview를 공식 온보딩 문서의 기준선으로 삼기

2. 인증/가입 흐름 잔재 정리
   - `/pending-approval` 관련 라우팅/분기 제거 또는 실제 페이지 복구
   - 승인 제거 정책과 UI 흐름을 일치시키기

3. 회비 관리 도메인 정렬
   - `membership_fee_*` 쿼리를 현재 스키마 기준으로 재작성
   - 타입 생성 또는 명시적 DTO 계층 도입

4. 린트 기준선 복구
   - `any`, `@ts-ignore` 제거
   - Edge Function용 타입 선언 정리

5. 운영 자동화 이동
   - 예약 정리 작업을 DB scheduled job 또는 서버 측 작업으로 이전

6. 테스트 범위 확장
   - 라우트 가드
   - 주요 mutation 훅
   - 관리자 패널
   - 회비/예산 흐름

## 14. 결론

이 프로젝트는 "예약 앱"이라는 이름보다 더 큰 범위를 이미 갖고 있다. 현재의 실체는 동아리 운영 플랫폼의 1차 구현본이며, 예약 도메인과 관리자 도구는 꽤 잘 잡혀 있다. 반면 문서 부재, 승인 흐름 잔재, 회비 관리 스키마 드리프트처럼 "빠르게 확장하면서 남은 이음새"가 분명히 존재한다.

즉, 지금 이 저장소는 새 기능을 더 얹기 전에 한 번 기준선을 재정리하면 훨씬 오래 갈 수 있는 코드베이스다. 반대로 이 상태에서 기능을 계속 추가하면 운영성보다 문서/도메인 드리프트가 더 빨리 커질 가능성이 높다.

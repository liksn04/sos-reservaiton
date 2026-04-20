# 빛소리 SOS Reservation

빛소리 동아리의 합주실 예약, 행사 관리, 예산 관리, 회원 운영을 모바일 중심으로 묶은 Supabase 기반 운영 SPA입니다.

자세한 온보딩 문서는 [docs/project-overview-report-2026-04-20.md](./docs/project-overview-report-2026-04-20.md)를 참고하세요.

## 핵심 기능

- 합주실 예약
  - 월간 캘린더 조회
  - 예약 생성, 수정, 삭제
  - 초대 인원 관리
  - 과거 날짜, 과거 시작 시각, 시간 겹침, 당일 합주 정책 검증
- 행사 허브
  - 다가오는 일정, 지난 일정, 타임라인 뷰
  - 관리자 행사 등록, 수정, 삭제
  - 참가 신청 및 출석 체크
- 관리자 도구
  - 회원 검색
  - 관리자 권한 부여/해제
  - 차단/차단 해제
  - 예약 정책 시즌 관리
  - 감사 로그 조회
- 예산 허브
  - 거래 내역 등록, 수정, 삭제
  - 카테고리 관리
  - 차트 기반 요약
  - 회비/예산 운영 UI
- 운영 편의
  - PWA 업데이트 프롬프트
  - 오프라인 배너
  - 라이트/다크 테마
  - 회원 탈퇴 및 관리자 계정 삭제 Edge Function

## 기술 스택

- Frontend: Vite, React 19, TypeScript, React Router 7
- Server state: TanStack Query 5
- Backend: Supabase Auth, Postgres, Realtime, Storage, Edge Functions
- UI: TailwindCSS 3, Framer Motion, Lucide React, Recharts
- Quality: ESLint, Vitest, V8 Coverage
- PWA: `vite-plugin-pwa`

## 프로젝트 구조

```text
src/
  components/   공용 UI, 모달, 관리자 패널, 캘린더
  context/      인증 컨텍스트
  contexts/     테마, 토스트
  hooks/        React Query 쿼리/뮤테이션
  lib/          Supabase client, queryKeys, realtime, lazy loader
  routes/       페이지 라우트
  types/        도메인 타입
  utils/        시간/예약 정책/검증 유틸

supabase/
  migrations/   DB 스키마와 RLS 정책
  functions/    계정 삭제, 관리자 사용자 삭제 Edge Functions

public/         PWA 아이콘과 정적 에셋
docs/           온보딩/분석 문서
```

## 주요 도메인

- `profiles`
  - 사용자 프로필, 관리자 여부, 차단 메타데이터
- `reservations`, `reservation_invitees`
  - 합주실 예약과 초대 인원
- `reservation_policy_seasons`
  - 합주 당일 예약 예외 시즌
- `event_categories`, `club_events`, `event_participants`
  - 행사 허브와 RSVP
- `budget_categories`, `budget_transactions`
  - 예산/회계 거래
- `membership_fee_policies`, `membership_fee_records`
  - 회비 정책과 납부 기록

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

루트 `.env.local`에 아래 값을 설정합니다.

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ENABLE_SUPABASE_REALTIME=true
```

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 개발 포트는 `5150`입니다.

## 자주 쓰는 명령

```bash
npm run dev
npm run test
npm run test:coverage
npm run lint
npm run build
```

## Supabase 메모

- 프론트는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 사용합니다.
- Realtime WebSocket은 기본적으로 모든 환경에서 꺼져 있습니다. 실제로 필요할 때만 `VITE_ENABLE_SUPABASE_REALTIME=true`를 추가해 활성화하세요.
- Edge Function은 Supabase 프로젝트 환경 변수의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`를 사용합니다.
- 주요 보안은 Supabase RLS와 helper function(`is_approved`, `is_admin_user`)에 의존합니다.
- 당일 합주 예약 예외는 `reservation_policy_seasons`와 DB trigger로 함께 제어합니다.

## 개발 시 참고 사항

- 카카오 OAuth가 기본 로그인 흐름입니다.
- 개발 환경에서는 익명 로그인 경로가 일부 열려 있습니다.
- Realtime invalidate는 `src/lib/RealtimeProvider.tsx`에서 중앙 관리합니다.
- 라우트/관리자 탭은 lazy loading과 idle prefetch를 사용합니다.
- 최신 저장소 분석 문서는 `docs/project-overview-report-2026-04-20.md`에 유지합니다.

## 품질 기준

- `npm run test`
- `npm run test:coverage`
- `npm run lint`
- `npm run build`

기능 수정 후에는 최소한 위 네 가지 명령으로 기준선을 확인하는 것을 권장합니다.

# SOS Reservation Code Review and Refactor Plan

Reviewed: 2026-05-01
Scope: full local codebase review, with emphasis on SOLID boundaries and spaghetti-code reduction.

## Baseline

- Worktree was clean before the review.
- No uncommitted application code changes were present, so ECC local review was applied to the current full codebase rather than a diff.
- Source size: 100 TypeScript/TSX files under `src`, about 11.4k lines.
- Largest hotspots:
  - `src/components/BudgetTransactionModal.tsx` - 511 lines
  - `src/routes/EventsRoute.tsx` - 427 lines
  - `src/components/EventModal.tsx` - 392 lines
  - `src/components/admin/ReservationPolicyTab.tsx` - 365 lines
  - `src/routes/BudgetRoute.tsx` - 327 lines
  - `src/components/MembershipFeePanel.tsx` - 312 lines
  - `src/routes/ProfileRoute.tsx` - 308 lines
  - `src/components/ProfileForm.tsx` - 307 lines
  - `src/index.css` - 1291 lines

## Validation

| Check | Result | Notes |
|---|---:|---|
| `npm run lint` | Pass | ESLint completed with no findings. |
| `npm test` | Pass | 8 files, 49 tests passed. |
| `npm run build` | Pass | TypeScript build and Vite production build completed. |
| `npm audit --audit-level=high` | Fail | 5 high and 1 moderate advisories; see dependency plan below. |

## Findings

### HIGH - 회비 납부 토글이 정책 ID와 납부 레코드 ID를 혼동함

`src/hooks/mutations/useBudgetMutations.ts`의 `markMembershipPaid`는 `policyId`를 받은 뒤 `membership_fee_records.id`로 조회한다. 스키마상 정책 금액은 `membership_fee_policies.amount`에 있고, 납부 레코드는 `policy_id`를 외래키로 갖는다. 현재 코드는 대부분의 실제 정책 ID에서 레코드를 찾지 못해 "유효한 회비 정책을 찾을 수 없습니다."로 실패하거나, 우연히 같은 UUID가 있을 때 잘못된 금액을 사용할 수 있다.

Fix direction:
- `membership_fee_policies`에서 `.select('amount').eq('id', policyId).maybeSingle()`로 조회한다.
- `markMembershipPaid` 전용 테스트를 추가한다.
- 회비 정책 조회/납부 기록 upsert를 `budgetService` 또는 `membershipFeeService`로 분리한다.

### HIGH - 예약 수정 초대 목록 교체가 중간 실패를 무시함

`src/hooks/mutations/useReservationMutations.ts`의 업데이트 흐름은 기존 `reservation_invitees` 삭제 결과를 확인하지 않고 새 초대 목록을 insert한다. 삭제가 RLS, 네트워크, 제약 조건 문제로 실패하면 중복 초대, 오래된 초대 잔존, 부분 성공 상태가 생길 수 있다.

Fix direction:
- 삭제 결과의 `error`를 검사해 즉시 throw한다.
- 가능하면 `replace_reservation_invitees` 같은 DB RPC로 삭제와 insert를 하나의 트랜잭션으로 묶는다.
- 클라이언트 mutation은 payload 검증과 RPC 호출만 담당하게 줄인다.

### HIGH - 의존성 audit에 high advisories가 있음

`npm audit --audit-level=high`에서 `vite@8.0.0-8.0.4`, `serialize-javascript <=7.0.4`, `@rollup/plugin-terser`, `workbox-build`, `vite-plugin-pwa` 경로의 high advisories가 확인됐다. Vite dev-server 파일 읽기/경로 우회 계열은 로컬 개발 노출 범위에 따라 실제 위험도가 달라지지만, 운영 저장소 기준으로는 별도 보안 정리 게이트가 필요하다.

Fix direction:
- 먼저 `npm audit fix`로 비파괴 업데이트를 시도한다.
- `vite-plugin-pwa` 체인은 `npm audit fix --force`가 breaking downgrade를 제안하므로, 무조건 force하지 말고 최신 호환 버전 조합을 수동 확인한다.
- dependency-only 브랜치에서 `npm run lint`, `npm test`, `npm run build`, PWA smoke를 재실행한다.

### MEDIUM - 대형 UI 컴포넌트가 여러 책임을 동시에 가짐

`BudgetTransactionModal`, `EventModal`, `BudgetRoute`, `EventsRoute`, `MembershipFeePanel`, `ProfileForm`은 화면 렌더링, form state, validation, upload/category mutation, confirm/alert, toast를 한 파일에서 같이 처리한다. 변경 충돌과 회귀 위험이 커지는 전형적인 spaghetti surface다.

Fix direction:
- 모달별로 `use*FormState`, `use*Submit`, `*CategoryEditor`, `*FormFields`, `*Footer`를 분리한다.
- route 파일은 data orchestration과 section composition만 남긴다.
- 화면 조각은 props-only/presentational 컴포넌트로 이동한다.

### MEDIUM - 관리자 mutation의 감사 로그가 best-effort로 흩어져 있음

`useBanUser`, `useUnbanUser`, `useSetAdminRole`, `admin-delete-user`가 각각 profile mutation과 audit insert를 직접 조합한다. 일부 흐름은 audit insert 실패를 확인하지 않아 운영 감사 추적이 누락될 수 있다.

Fix direction:
- 관리자 작업은 Edge Function 또는 RPC로 이동해 권한 확인, 상태 변경, audit insert를 한 경계에서 처리한다.
- 클라이언트 hook은 `adminUserService.ban/unban/setRole/delete` 같은 얇은 호출자로 둔다.
- audit 실패 정책을 명확히 정한다. 운영 감사가 필수라면 상태 변경도 실패시킨다.

### MEDIUM - 파일 업로드 검증과 object URL 수명 관리가 중복/불완전함

영수증 업로드는 모달에서 이미지 MIME과 5MB를 검사하지만 `uploadReceipt` 자체는 exported helper임에도 같은 검증을 강제하지 않는다. 아바타 업로드는 파일 타입/크기 검증이 없고, `URL.createObjectURL`을 revoke하지 않는다.

Fix direction:
- `src/utils/fileUpload.ts`에 `validateImageFile`, `getSafeImageExtension`, `createRevocablePreviewUrl`을 둔다.
- 아바타와 영수증 업로드가 같은 검증 기준을 쓰게 한다.
- storage path 생성은 user id, domain, random id, normalized extension으로 통일한다.

### MEDIUM - CSS가 단일 파일에 과밀함

`src/index.css`가 1291라인이며 theme tokens, layout, modal, cards, forms, route-specific tweaks가 섞여 있다. Tailwind class와 global CSS utility가 동시에 확장되면서 UI 변경의 영향 범위가 커진다.

Fix direction:
- `styles/tokens.css`, `styles/components.css`, `styles/layout.css`, `styles/routes.css`, `styles/theme-light.css`로 분리한다.
- 먼저 class name 변경 없이 import split만 수행한다.
- 이후 route-specific global class를 컴포넌트-local composition으로 줄인다.

## Refactor Execution Plan

### Phase 0 - Safety Gate

Goal: behavior-preserving baseline and highest-risk bug fixes.

1. Fix `markMembershipPaid` policy lookup and add a focused test.
2. Check reservation invitee delete errors before insert; ideally introduce a DB transaction/RPC.
3. Resolve or pin dependency audit plan without force-downgrade.
4. Keep every step green with `npm run lint`, `npm test`, `npm run build`.

Exit criteria:
- 회비 납부 토글이 실제 policy id로 성공한다.
- 예약 수정 중 invitee replacement가 partial success를 만들지 않는다.
- audit action decision이 문서화되거나 dependency patch가 적용된다.

### Phase 1 - Service Boundary Extraction

Goal: React hooks stop owning database workflow details.

1. Create domain services:
   - `src/services/budgetService.ts`
   - `src/services/membershipFeeService.ts`
   - `src/services/reservationService.ts`
   - `src/services/adminUserService.ts`
2. Move Supabase query/mutation bodies into services.
3. Keep React Query hooks responsible only for mutation wiring, cache invalidation, and UI-facing error propagation.
4. Add tests around pure service payload builders and validation helpers where Supabase integration cannot be locally mocked cheaply.

SOLID target:
- Single Responsibility: hooks stop mixing remote workflow, validation, cache policy, and UI messaging.
- Dependency Inversion: components depend on hooks/services, not raw Supabase query details.

### Phase 2 - Modal and Route Decomposition

Goal: reduce large UI files into composable sections without behavior changes.

Priority order:
1. `BudgetTransactionModal.tsx`
   - Extract `useBudgetTransactionForm`
   - Extract `BudgetCategoryPicker`
   - Extract `ReceiptUploader`
   - Extract `BudgetTransactionFields`
2. `EventModal.tsx`
   - Extract `useEventForm`
   - Extract shared `CategoryEditor`
   - Extract date/time field group
3. `BudgetRoute.tsx`
   - Extract `BudgetSummaryCards`
   - Extract `BudgetTransactionList`
   - Extract tab state helpers
4. `EventsRoute.tsx`
   - Extract `useFilteredEvents`
   - Move `EventCard` into its own file
   - Keep route file as page composition only
5. `ProfileForm.tsx`
   - Extract shared profile fields once, with setup/edit style variants.

Exit criteria:
- No component file above about 250 lines unless it is intentionally a route composition file.
- No route file owns complex inline item card rendering.
- Modal files do not directly perform upload/category CRUD.

### Phase 3 - Shared Interaction and Upload Primitives

Goal: remove repeated browser primitive use from product surfaces.

1. Replace `confirm`/`alert` with a shared confirmation/toast pattern.
2. Centralize upload validation and preview lifecycle.
3. Normalize user-facing error mapping in `src/utils/errors.ts`.
4. Remove production `console.log`; keep gated `console.warn/error` only where operationally useful.

Exit criteria:
- `rg "confirm\\(|alert\\(|URL\\.createObjectURL|console\\.log" src` is empty or explicitly allowlisted.
- Avatar and receipt upload use one shared validator.

### Phase 4 - CSS Split

Goal: lower styling blast radius before larger UI work.

1. Split `index.css` by responsibility without class renames.
2. Keep import order deterministic in `src/main.tsx`.
3. Run mobile smoke around reserve, events, budget, profile because these classes are heavily shared.

Exit criteria:
- `src/index.css` becomes a small import hub.
- Shared classes have obvious ownership.
- No visual regressions on core mobile routes.

## Recommended First Gate

Start with Phase 0 as a narrow bugfix/security gate:

1. Fix `markMembershipPaid`.
2. Fix invitee replacement error handling.
3. Add tests for both.
4. Re-run lint/test/build.
5. Decide dependency audit remediation separately, because `vite-plugin-pwa` may require version strategy rather than blind force.

## Phase 0 Action Log - 2026-05-01

Applied:
- Fixed `markMembershipPaid` to read the policy amount from `membership_fee_policies` by `policyId` before upserting `membership_fee_records`.
- Fixed reservation invitee replacement to throw when deleting old `reservation_invitees` fails.
- Ran `npm audit fix` and then resolved the remaining Workbox/terser advisory without `--force`.
- Added an npm `overrides` entry for `@rollup/plugin-terser@^1.0.0`, which brings `serialize-javascript` to a non-vulnerable version.
- Aligned the bundler peer range by using `vite@^7.3.2` with `@vitejs/plugin-react@^5.2.0`, keeping compatibility with `vite-plugin-pwa@1.2.0`.

Validation after action:
- `npm ls vite-plugin-pwa workbox-build @rollup/plugin-terser serialize-javascript vite postcss @vitejs/plugin-react` passes with no peer dependency errors.
- `npm audit --audit-level=high` passes with `found 0 vulnerabilities`.
- `npm run lint` passes.
- `npm test` passes: 8 test files, 49 tests.
- `npm run build` passes with PWA generation.

Remaining non-blocking follow-up:
- Vite build reports a circular chunk warning involving `vendor -> react-vendor -> vendor` and a large `vendor` chunk above 500 kB. This is not caused by the security fixes alone, but the manual chunk strategy should be revisited in a later performance gate.

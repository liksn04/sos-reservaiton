# SUPABASE KNOWLEDGE BASE

## OVERVIEW

`supabase` is the backend/security boundary: Postgres schema, RLS, storage
policies, cron scheduling, push reminder tables, and service-role Edge Functions.

## STRUCTURE

```text
supabase/
├── migrations/   # schema, RLS, helper functions, triggers, cron setup
└── functions/    # Deno Edge Functions for account/admin/reminder workflows
```

## WHERE TO LOOK

| Task | Location | Notes |
|---|---|---|
| Initial schema/RLS | `migrations/0001_init.sql` | Profiles, reservations, invitees, helper functions |
| Admin/account logs | `0002_account_deletion_log.sql`, `0003_admin_features.sql` | Deletion/audit/banned state |
| Events | `0004_events_hub.sql`, `0005_event_participants.sql` | Event categories, RSVP, attendance |
| Budget/fees | `0006_budget_hub.sql` | Transactions, categories, fee policies/records |
| Reservation ops | `20260501074535_reservation_ops_features.sql`, `0009_reservation_policy_seasons.sql` | Change log and same-day policy seasons |
| Push reminders | `20260501183000_reservation_push_reminders.sql`, `20260501190000_schedule_reservation_reminders.sql` | Subscription, delivery, cron/net |
| Security fixes | `20260501193000_fix_security_advisor_warnings.sql`, `20260501194000_restore_rls_helper_execution.sql` | Search path, helper execution, storage policy hardening |
| Legal documents | `20260521151119_legal_documents.sql`, `20260522000000_legal_documents.sql`, `20260522010000_roomin_brand_legal_documents.sql` | Public read, admin write docs |
| Admin delete user | `functions/admin-delete-user/index.ts` | Admin-only service-role deletion |
| Self delete | `functions/delete-account/index.ts` | User self-deletion and deletion log |
| Reservation reminders | `functions/send-reservation-reminders/index.ts` | Cron-triggered push notifications |

## CONVENTIONS

- Migration names are mixed: early `0001_*` sequential files, later timestamped feature/fix files.
- RLS is the main frontend security boundary; helper functions such as `is_approved` and `is_admin_user` are part of that contract.
- Service-role operations belong in Edge Functions, not the SPA.
- Admin state changes should preserve audit logs; audit persistence failure is operationally significant.
- Reminder function calls are designed for Supabase Cron POST every 5 minutes.

## SECURITY NOTES

- Edge Functions depend on `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in the Supabase project environment.
- Push reminders also require web-push/VAPID secrets.
- `send-reservation-reminders` accepts service-role bearer auth or `x-cron-secret`; leaking either is critical.
- Storage policy hardening in `20260501193000_fix_security_advisor_warnings.sql` is intentional.
- Public legal-document reads are intentional; writes must remain admin-only.

## ANTI-PATTERNS

- Do not add frontend code paths that require service-role credentials.
- Do not weaken RLS to compensate for frontend query shape.
- Do not make destructive account/admin operations skip audit logging.
- Do not add table-changing migrations without checking whether `src/lib/RealtimeProvider.tsx` and `src/lib/queryKeys.ts` need corresponding updates.

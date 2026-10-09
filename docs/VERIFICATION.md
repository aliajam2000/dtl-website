# Verification record

## Local execution — 8 October 2026

| Check | Result | Boundary |
| --- | --- | --- |
| Reproducible Python build | PASS: 7 pages generated | No production environment changes |
| Internal links, anchors, metadata, one H1/main, language | PASS on all 7 pages | Structural checks, not a full accessibility certification |
| Intake/frontend/SQL tests | PASS: 18 tests | `npm test`; see tests in repository |
| Closed form | PASS: disabled fields; no external script/call | DOM unit test |
| Enabled form success/error/retry | PASS; input retained on failure, no false success | Mock transport and DOM harness |
| Mobile menu state and Escape | PASS | DOM harness, not viewport rendering |
| Server input limits, types, email/URL, consent, honeypot | PASS | Local handler |
| Origin/method/content-type and captcha hostname/action | PASS | Mock verification adapter |
| Database migration | PASS on isolated PGlite Postgres | Actual production schema not inspected |
| Anonymous/authenticated/service-role table & function denial | PASS | Fresh isolated database roles |
| Writer has function-only access and cannot switch to owner | PASS | Isolated database; no inherited production PUBLIC grants |
| Deduplication and pending_review | PASS; repeated submissions yield one row | Isolated Postgres |
| Daily capacity quota | PASS; 100 rows accepted, next new enquiry limited | Sequential local test; live concurrency not tested |
| Administrative status review | PASS as isolated DB admin | Supabase Dashboard not tested |
| Git whitespace / JS syntax | PASS | Local source checks |
| Deno Edge Function type check | PASS, Deno 2.5.4 | `deno check --node-modules-dir=manual`; pinned postgres dev dependency |

No real applicant or participant information was used in testing.

## Not verified / remains blocked

- Role/assignment-scoped portal authorization (catalog inspection is now complete; see below).
- Supabase production migration, Edge Function deployment, TLS connection.
- Real Turnstile provider validation and production synthetic application receipt.
- Anonymous Data API denial against the actual Supabase project.
- Administrative review in the authenticated Supabase Dashboard.
- Notification email (no provider or authorized inbox configured).
- Private portal authentication, partner A/B isolation and researcher pseudonymization.
  The portal is closed and has no Auth/CRUD implementation; these are NOT passed tests.
- Operational privacy notice/contact/retention and collection activation.

Public GitHub commit, CI, deployment and live rendering evidence are reported
separately after publication; this local record does not imply those have passed.

## Live checks — 9 October 2026

- Public release commit: `85633f01914e267b48d6719ed51512bfe0ab5fc3`.
- GitHub Pages run `37781620846`: completed/success. Website CI run
  `37781621897`: completed/success. PR #1 was merged.
- Browser verified the redesigned homepage and followed navigation to the
  partnership page at the existing GitHub Pages URL. Desktop screenshot visually
  checked; form fields and submission are disabled as intended. No site-origin
  console errors observed (an unrelated browser-extension error was present).
- Mobile layout is implemented but no live mobile viewport rendering test has
  been completed. No full accessibility certification is claimed.
- Supabase project `DTL Poverty Observatory` is ACTIVE_HEALTHY.
- Read-only catalog inspection found all eleven named tables: communities,
  partners, households, people, consents, assessments, needs, interventions,
  outcomes, partner_assignments, audit_events. All have RLS enabled; none has
  a row policy. Table/schema ACLs are postgres-only. No SQL functions in public
  or observatory were returned. Intake schema/roles do not yet exist.
- Security advisor reports 11 informational `rls_enabled_no_policy` findings:
  https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
  Closed access is intentional until real role/assignment policies are designed.
  Do not add permissive policies merely to silence this notice.
- No deployed Edge Functions were listed.
- Applying `partner_intake` was blocked by automatic approval review: persistent
  production roles, policies and SECURITY DEFINER function require explicit
  authorization. No fallback mutation or workaround was attempted.
- Remaining activation prerequisites: approval of this prepared migration;
  restricted writer credential and function secrets; Turnstile configuration;
  finalized privacy contact/retention; actual live persistence/denial tests.

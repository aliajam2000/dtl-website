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

No real applicant or participant information was used in testing.

## Not verified / remains blocked

- Existing `observatory` schema, remaining two table names, grants, policies and RPCs.
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

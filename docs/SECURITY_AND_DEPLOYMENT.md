# Security and deployment — public website and partner intake

## Release state

The public site can launch independently. `config.js` intentionally has
`applicationsEnabled: false`. `INTAKE_ENABLED` defaults to false. The household
portal is a non-collecting closed page. Neither the frontend flag nor a static
page is an authorization mechanism: the backend must enforce every restriction.
No Supabase migration or function has been applied to the live project during
this implementation. The existing `observatory` catalog was inspected read-only on 9 October 2026.
The two unspecified tables are `assessments` and `audit_events`. All 11 tables
have RLS enabled, no row policies, and postgres-only table/schema grants.
No public/observatory SQL functions were found. This is a closed starting state,
not verified role-scoped portal authorization. The attempted intake migration
was rejected by automatic approval review as a production security mutation;
it was not applied. Explicit user approval is required before retrying.

## Architecture

- Existing GitHub Pages URL and root publication retained.
- Committed static HTML, shared CSS/JS; Python standard-library page generator.
- No frontend runtime dependency, CDN fonts, analytics, or client Supabase key.
- Public application endpoint: separately deployed Supabase Edge Function.
- Server-side Turnstile verification: success, exact hostname, exact action.
- Strict input validation, 16 KiB streamed body limit, honeypot, no raw input logs.
- Exact Origin CORS; **CORS is not authentication** and cannot stop custom clients.
- Atomic database deduplication: one application per email digest per 24 hours,
  plus request UUID for retries. Same generic success for duplicates.
- Global daily quota of 100 new applications to cap early-stage intake. This is
  capacity protection, not a complete DDoS defense. Attackers with valid tokens
  could exhaust the quota; monitor and tune before a larger launch.
- Only `pending_review` can be assigned by intake. User role/status fields ignored.
- Private `dtl_intake` schema, never added to Data API exposed schemas.
- Dedicated database login can execute **one** security-definer function; cannot
  select/insert tables directly. Non-login function owner has explicit RLS policies.
- No service-role key is used. Endpoint has no list/review route.
- Initial administrative review is in the authenticated Supabase Dashboard by
  the authorized project administrator, not a public admin web page.

## Exact activation steps

1. Sign in to the existing **DTL Poverty Observatory** project, reference
   `fmlcpdlxbuhaymzvjxwu`. Use `docs/SCHEMA_INSPECTION.sql` to inspect metadata.
   Confirm all actual tables, RLS, grants, RPC security-definer functions,
   role memberships, and exposed schemas. Do not export participant rows to git.
2. Review the staged migration in an isolated development database first.
   The migration intentionally fails if its schema or roles already exist.
   Do not rename/drop existing objects to force it through. Compare them first.
   It does not alter any `observatory` table. Check effective privileges inherited
   from PUBLIC; if they expose existing participant tables/functions to the new
   roles, resolve with a reviewed existing-schema migration before provisioning
   a LOGIN credential. Fresh intake isolation is not evidence that existing
   Observatory authorization is safe.
3. Apply the reviewed migration as an authorized database administrator. The SQL
   creates a NOLOGIN writer deliberately. Provision its login/password securely
   outside git, with no extra role membership, then verify effective privileges.
   Use the project's actual direct or pooler connection details for this role.
   Do not put the postgres administrator password in `INTAKE_DATABASE_URL`.
   Configure verified TLS; install the project's CA if required. Never disable
   certificate checks to make a connection work.
4. Configure a Cloudflare Turnstile widget for `aliajam2000.github.io` (no wildcard
   or localhost in production). Use the public site key in `config.js` and store
   its secret in Supabase function secrets. Account setup is not completed by
   this repository. Do not buy a plan or add a paid service without approval.
5. Set the backend variables from `.env.example` in Supabase secrets. Generate a
   strong random `INTAKE_DIGEST_SECRET` via secure tooling. Keep values out of
   chat, command history, logs, source, and Actions. `ALLOWED_ORIGIN` is
   `https://aliajam2000.github.io` (an Origin has no path).
   `TURNSTILE_HOSTNAME` is `aliajam2000.github.io`.
6. With Supabase CLI authenticated securely, deploy only the named function:

   ```sh
   supabase functions deploy partner-apply --project-ref fmlcpdlxbuhaymzvjxwu
   ```

   `supabase/config.toml` sets `verify_jwt=false` for this public intake only.
   This does not authorize household access. The handler remains closed until
   `INTAKE_ENABLED=true` and all backend secrets are present. Run Deno checks and
   local integration tests in the Supabase runtime before deployment.
7. Finalize and publish the privacy notice: verified controller/contact, retention
   period and deletion process, applicable rights, storage region/transfer
   arrangements, and provider disclosures. Replace the current “not open” copy
   consistently. Do not invent these operational decisions or contact addresses.
8. In a controlled setup, enable the backend and test a clearly synthetic enquiry
   with `example.invalid` contact details. Verify pending_review persistence,
   duplicate handling, concurrent quota behavior, failure states, and denied
   direct API/table access as anon, authenticated, and writer. Record real results.
9. Verify authorized admin review in the Dashboard. Configure no email notices
   unless a secure provider and the founder-designated recipient are available.
   Database receipt is sufficient; notifications are optional and unconfigured.
10. Only after those checks set `applicationsEnabled: true` and the public
    Turnstile site key, commit and publish. Perform one controlled end-to-end
    production synthetic submission. The portal remains separately closed.

## Admin review (initial implementation)

Use the authenticated Supabase Dashboard Table Editor, schema `dtl_intake`, table
`partner_applications`, filter `status = pending_review`. Confirm the selected
project first. Inspect an application; update `status`, `reviewed_at`, and a
minimal `review_note` as appropriate. Status `approved` here is a review label;
it does **not** create Auth accounts, grant data access, or establish a contract.
No new collaborator or reviewer access has been granted. Do not export records
into public issues or this repository. This workflow requires verification on
live Supabase and is not claimed as tested.

## Household portal gate

The public `/dtl-website/portal/` route is a closed informational page, not a
private data app or functional demo. No participant form, login, token, data API,
or household CRUD is shipped. Unknown schema has not been guessed.

Before implementation/release: inspect actual schema; approve consent and local
protocols; map authenticated IDs to server-managed roles and community/record
assignments; separate identifiers from researcher views; implement audited,
append-only assessments; verify account revocation and backups. Run independent
anon, unapproved-user, partner A/B, enumerator, researcher and administrator
checks. Test direct REST/RPC requests as well as UI. Client-side route guards
are insufficient. Never let users edit their own role or assignments.

## Verification limits

Local handler tests use fake verification and persistence adapters. Local
Postgres tests run PGlite in an isolated database and exercise SQL permissions,
deduplication and quotas; they do not validate Supabase's production grants,
Auth, PostgREST, Edge runtime, TLS or anti-bot provider. Live isolation and
end-to-end receipt remain blockers. See `docs/VERIFICATION.md`.

## Deployment and rollback

The repository already uses the GitHub Pages **pages build and deployment**
workflow triggered by branch publication. Keep that setup; CI only checks files
and does not deploy databases or change Pages settings. Generated HTML is committed.
The existing published path `/dtl-website/` is retained, with directory index
routes so direct visits and refresh work. `_config.yml` excludes build/backend
source from the static publication; source remains public in the repository.

Public rollback: revert the site change on main and verify a successful Pages
run plus the previous live content. Backend emergency stop: set `INTAKE_ENABLED`
to false, then set the frontend flag false. Do not drop intake tables to roll
back code. A migration rollback involving collected records requires a reviewed
retention/recovery plan, not a destructive automatic command.

## Technical references

- https://supabase.com/docs/guides/functions/connect-to-postgres
- https://supabase.com/docs/guides/functions/function-configuration
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

# Development Technology Lab

Research-first public website at https://aliajam2000.github.io/dtl-website/.
Warm off-white, navy, restrained green; five public navigation pages, privacy
notice and a closed portal. Early-stage status and impact claims are explicit.

## Run and edit

```sh
python3 scripts/build.py
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Content lives in `templates/`; shared layout and
metadata in `scripts/build.py`; design in `style.css`. Commit generated HTML after
editing templates. The public site needs no Node runtime or external fonts.

To check the real deployment base path, serve the repository's parent directory
and open `/dtl-website/`. Directory routes preserve normal links and refresh.

## Verify

Python 3 and Node 22+ are required for checks. Node dependencies are test-only.

```sh
npm ci
npm run build
npm test
```

The Edge Function can be type-checked after `npm ci` with:

```sh
npx --yes deno@2.5.4 check --node-modules-dir=manual supabase/functions/partner-apply/index.ts
```

The SQL tests use an isolated local PGlite Postgres database with synthetic data.
They never contact Supabase. Frontend tests use a DOM harness and mocked transport;
handler tests inject mock provider/database adapters. See the verification report
for the exact boundary between local tests and live verification.

## Intake is implemented, not activated

`config.js` keeps public applications closed. The Supabase intake migration was applied to the live project on 9 October 2026;
its Edge Function code is committed but NOT deployed. These components implement a separate, least-privilege intake path with validation,
server-verified Turnstile, atomic quota/deduplication, and pending review status.
The live schema was inspected on 9 October 2026. The `dtl_intake` tables and
restricted function have been created and verified; no Edge Function deployment
has been completed, and `applicationsEnabled` remains false.

Supabase access is now connected. Before activation, the project still needs a dedicated restricted LOGIN and TLS
connection secret, function deployment, Turnstile configuration, a verified
privacy contact and finalized privacy notice, and successful live denial/intake
tests. A function deployment attempt was blocked by execution safety checks;
no completed deployment is claimed. No email provider or
notification recipient is configured. Do not collect participant data here.

The `/portal/` page is closed information only. It is not an authenticated portal
or functional demonstration. Household functionality remains gated pending
actual-schema discovery and authorization tests.

- [Deployment and security runbook](docs/SECURITY_AND_DEPLOYMENT.md)
- [Read-only schema inspection](docs/SCHEMA_INSPECTION.sql)
- [Verification results](docs/VERIFICATION.md)

No credentials or participant data belong in this repository.

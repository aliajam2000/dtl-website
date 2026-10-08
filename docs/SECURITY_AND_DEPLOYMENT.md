# Security and deployment gate

## What is implemented
Static responsive public research website, transparent Observatory description, non-collecting partner form, safe closed portal placeholder.

## Blockers before live data collection
1. Obtain authorized read-only SQL schema, grants, RLS policy, foreign-key and RPC review for Supabase project `fmlcpdlxbuhaymzvjxwu`, schema `observatory`.
2. Design isolated partner_applications table and reviewed migration; never overwrite existing tables.
3. Configure an authenticated backend or Supabase Edge Function with anti-spam, validation, rate limits and restrictive grants.
4. Implement Supabase Auth and server-side / RLS assignment-scoped authorization for administrator, researcher, partner, enumerator.
5. Build tested CRUD and append-only longitudinal assessment workflow with consent and audit logs.
6. Establish lawful basis, local data protection review, retention, deletion, backup and incident-response procedures.
7. Run multi-user denial tests: anonymous read/write, unapproved partner, cross-partner records, enumeration, researcher direct identifiers, revoked access.
8. Only then enable partner applications and private portal.

## Hosting
The public site can deploy on GitHub Pages. Private data access cannot be implemented by GitHub Pages alone. Deploy private app through a suitable authenticated hosting environment and restrictive Supabase policies. Never commit service-role keys or participant data.

## Test status
Static HTML/CSS checked for packaging only. No live Supabase authorization, real form submission or deployment tests were possible without access.

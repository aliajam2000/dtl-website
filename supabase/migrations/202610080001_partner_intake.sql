-- STAGED / NOT APPLIED. Review against live catalog before running.
-- Intentionally separate from observatory. Does not assume ANY household columns.
-- Fail on existing names instead of overwriting live objects.
begin;
create schema dtl_intake;
revoke all on schema dtl_intake from public, anon, authenticated, service_role;
create role dtl_intake_writer nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
create role dtl_intake_owner nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
grant usage on schema dtl_intake to dtl_intake_writer, dtl_intake_owner;
create table dtl_intake.partner_applications (
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null unique,
 email_key text not null check (email_key ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 status text not null default 'pending_review' check(status in ('pending_review','contacted','declined','approved')),
 full_name text not null check(length(full_name) between 2 and 120),
 organization_name text not null check(length(organization_name) between 2 and 180),
 organization_type text not null check(organization_type in ('Local NGO','Community organization','University','Research group','Field enumerator','Development practitioner','Other')),
 country text not null check(length(country) between 2 and 100),
 region text not null check(length(region) between 2 and 180),
 email text not null check(length(email) between 3 and 254),
 website text not null default '' check(length(website)<=300),
 languages text not null check(length(languages) between 2 and 300),
 experience text not null check(length(experience) between 20 and 3000),
 collaboration text not null check(length(collaboration) between 20 and 3000),
 message text not null check(length(message) between 10 and 3000),
 privacy_acknowledged boolean not null check(privacy_acknowledged),
 privacy_version text not null,
 reviewed_at timestamptz,
 review_note text
);
create index partner_applications_email_time on dtl_intake.partner_applications(email_key, created_at desc);
create table dtl_intake.rate_limits (
 bucket text primary key,
 window_start timestamptz not null,
 attempts integer not null check(attempts>0)
);
alter table dtl_intake.partner_applications enable row level security;
alter table dtl_intake.partner_applications force row level security;
alter table dtl_intake.rate_limits enable row level security;
alter table dtl_intake.rate_limits force row level security;
revoke all on all tables in schema dtl_intake from public, anon, authenticated, service_role, dtl_intake_writer;
-- Only the non-login function owner can touch these tables.
grant select, insert on dtl_intake.partner_applications to dtl_intake_owner;
grant select, insert, update on dtl_intake.rate_limits to dtl_intake_owner;
create policy intake_function_select on dtl_intake.partner_applications for select to dtl_intake_owner using (true);
create policy intake_function_insert on dtl_intake.partner_applications for insert to dtl_intake_owner with check(status='pending_review');
create policy intake_rate_function on dtl_intake.rate_limits for all to dtl_intake_owner using(true) with check(true);
create function dtl_intake.submit_application(p jsonb, request uuid, digest text)
returns text language plpgsql security definer set search_path = pg_catalog, dtl_intake as $$
declare count_global integer;
begin
 if digest is null or digest !~ '^[0-9a-f]{64}$' or request is null or p->>'privacy_acknowledged' is distinct from 'true' then
   raise exception 'invalid input';
 end if;
 -- A single lock protects deduplication and the small, initial intake capacity.
 perform pg_advisory_xact_lock(743120864);
 if exists(select 1 from dtl_intake.partner_applications where request_id=request)
 or exists(select 1 from dtl_intake.partner_applications where email_key=digest and created_at>now()-interval '24 hours') then
   return 'accepted';
 end if;
 -- Atomic global daily quota; no trust in spoofable client IP headers.
 insert into dtl_intake.rate_limits(bucket,window_start,attempts)
 values ('global',date_trunc('day',now() at time zone 'UTC') at time zone 'UTC',1)
 on conflict(bucket) do update set
 attempts=case when rate_limits.window_start=excluded.window_start then rate_limits.attempts+1 else 1 end,
 window_start=excluded.window_start returning attempts into count_global;
 if count_global>100 then return 'rate_limited'; end if;
 insert into dtl_intake.partner_applications(request_id,email_key,full_name,organization_name,organization_type,country,region,email,website,languages,experience,collaboration,message,privacy_acknowledged,privacy_version)
 values(request,digest,p->>'full_name',p->>'organization_name',p->>'organization_type',p->>'country',p->>'region',p->>'email',coalesce(p->>'website',''),p->>'languages',p->>'experience',p->>'collaboration',p->>'message',true,'2026-10-intake-v1');
 return 'accepted';
end $$;
-- ALTER OWNER needs CREATE temporarily, immediately removed before commit.
grant create on schema dtl_intake to dtl_intake_owner;
alter function dtl_intake.submit_application(jsonb,uuid,text) owner to dtl_intake_owner;
revoke create on schema dtl_intake from dtl_intake_owner;
revoke all on function dtl_intake.submit_application(jsonb,uuid,text) from public, anon, authenticated, service_role;
grant execute on function dtl_intake.submit_application(jsonb,uuid,text) to dtl_intake_writer;
alter default privileges in schema dtl_intake revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema dtl_intake revoke execute on functions from public, anon, authenticated, service_role;
commit;
-- Provision dtl_intake_writer LOGIN/password outside git via secure admin tooling.
-- Do not grant membership of dtl_intake_owner to anyone or expose schema via Data API.

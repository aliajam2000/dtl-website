-- Read-only catalog inspection. Export metadata only, never household contents.
select table_name from information_schema.tables
where table_schema='observatory' order by table_name;
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='observatory'
order by table_name,ordinal_position;
select c.relname,c.relrowsecurity,c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='observatory' and c.relkind in ('r','p');
select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname='observatory';
select table_schema,table_name,grantee,privilege_type
from information_schema.table_privileges where table_schema in ('observatory','dtl_intake');
select n.nspname,c.relname,con.conname,pg_get_constraintdef(con.oid)
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace where n.nspname='observatory';
select n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('observatory','public');
-- After staging migration: effective access must include inherited PUBLIC grants.
-- Check for unintended access before creating a LOGIN credential.
select n.nspname,c.relname,
 has_table_privilege('dtl_intake_writer',c.oid,'SELECT') as writer_read,
 has_table_privilege('dtl_intake_writer',c.oid,'INSERT') as writer_write,
 has_table_privilege('dtl_intake_owner',c.oid,'SELECT') as owner_read
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='observatory' and c.relkind in ('r','p');

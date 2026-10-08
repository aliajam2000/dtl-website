import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';
const application = {full_name:'Synthetic Tester',organization_name:'Synthetic Lab',organization_type:'Research group',country:'Kenya',region:'Synthetic region',email:'synthetic@example.invalid',website:'',languages:'English',experience:'Synthetic research experience only.',collaboration:'Synthetic research collaboration only.',message:'Synthetic QA record only.',privacy_acknowledged:true};
test('isolated Postgres: migration, permissions, pending review, duplicates, rate cap, admin review',async()=>{
 const db=new PGlite();
 try {
  await db.exec('create role anon; create role authenticated; create role service_role;');
  await db.exec(await readFile(new URL('../supabase/migrations/202610080001_partner_intake.sql',import.meta.url),'utf8'));
  const call=async(id,digest='a'.repeat(64))=>(await db.query('select dtl_intake.submit_application($1::jsonb,$2::uuid,$3::text) as result',[JSON.stringify(application),id,digest])).rows[0].result;
  for(const role of ['anon','authenticated','service_role']) {
   await db.exec(`set session authorization ${role}`);
   await assert.rejects(()=>db.query('select * from dtl_intake.partner_applications'),/permission denied/);
   await assert.rejects(()=>call(randomUUID()),/permission denied/);
   await db.exec('set session authorization postgres'); // PGlite RESET keeps the current session identity.
  }
  await db.exec('set session authorization dtl_intake_writer');
  await assert.rejects(()=>db.query('select * from dtl_intake.partner_applications'),/permission denied/);
  await assert.rejects(()=>db.query("update dtl_intake.partner_applications set status='approved'"),/permission denied/);
  await assert.rejects(()=>db.exec('set role dtl_intake_owner'),/permission denied/);
  const id=randomUUID();
  assert.equal(await call(id),'accepted');
  assert.equal(await call(id),'accepted');
  assert.equal(await call(randomUUID()),'accepted');
  await db.exec('set session authorization postgres'); // PGlite RESET keeps the current session identity.
  const rows=(await db.query('select status, count(*) over() as total from dtl_intake.partner_applications')).rows;
  assert.equal(rows[0].status,'pending_review');assert.equal(rows[0].total,1);
  await db.exec('set session authorization dtl_intake_writer');
  for(let i=1;i<100;i++)assert.equal(await call(randomUUID(),i.toString(16).padStart(64,'0')),'accepted');
  assert.equal(await call(randomUUID(),'b'.repeat(64)),'rate_limited');
  await db.exec('set session authorization postgres'); // PGlite RESET keeps the current session identity.
  assert.equal((await db.query('select count(*) as n from dtl_intake.partner_applications')).rows[0].n,100);
  // Admin review does not change auth or grant any roles.
  await db.query("update dtl_intake.partner_applications set status='contacted',reviewed_at=now(),review_note='Synthetic QA review' where request_id=$1",[id]);
  assert.equal((await db.query('select status from dtl_intake.partner_applications where request_id=$1',[id])).rows[0].status,'contacted');
  console.log('SQL: anon/authenticated/service-role denied; writer function-only; no owner escalation; dedup=1; quota=100; admin update passed.');
 } finally {await db.close();}
});

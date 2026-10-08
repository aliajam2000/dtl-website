import postgres from 'npm:postgres@3.4.7';
import { createHandler } from './handler.mjs';
const dbUrl = Deno.env.get('INTAKE_DATABASE_URL');
const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
const digestSecret = Deno.env.get('INTAKE_DIGEST_SECRET');
const enabled = Deno.env.get('INTAKE_ENABLED') === 'true' && !!dbUrl && !!digestSecret;
// This must be a dedicated dtl_intake_writer LOGIN, never postgres/service_role.
const sql = dbUrl ? postgres(dbUrl, {prepare:false, max:1, ssl:'verify-full', connect_timeout:10, idle_timeout:20}) : null;
async function emailDigest(email: string) {
  const key = await crypto.subtle.importKey('raw',new TextEncoder().encode(digestSecret!),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const digest = await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(email));
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
Deno.serve(createHandler({
  enabled,
  origin: Deno.env.get('ALLOWED_ORIGIN'),
  hostname: Deno.env.get('TURNSTILE_HOSTNAME'),
  secret,
  verify: async (token: string) => {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret,response:token}),signal:AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Verification unavailable');
    return await response.json();
  },
  persist: async (application: Record<string,unknown>, requestId: string) => {
    if (!sql) throw new Error('Unavailable');
    const key = await emailDigest(application.email as string);
    const rows = await sql`select dtl_intake.submit_application(${JSON.stringify(application)}::jsonb, ${requestId}::uuid, ${key}) as result`;
    return rows[0]?.result;
  }
}));

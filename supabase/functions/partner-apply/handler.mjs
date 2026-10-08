import {validate,readLimitedJson} from './validation.mjs';
// Injectable dependencies make denial paths testable without secrets or a live DB.
export function createHandler({ enabled, origin, hostname, secret, verify, persist }) {
  return async (request) => {
    const allowed = request.headers.get('Origin') === origin;
    const headers = {'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if (allowed) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (status, body) => new Response(JSON.stringify(body), {status, headers});
    if (!allowed) return reply(403,{error:'forbidden'});
    if (request.method === 'OPTIONS') return new Response(null,{status:204, headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'content-type','Access-Control-Max-Age':'600'}});
    if (request.method !== 'POST') return reply(405,{error:'method_not_allowed'});
    if (!enabled || !secret || !origin || !hostname) return reply(503,{error:'unavailable'});
    if ((request.headers.get('Content-Type') || '').split(';')[0].trim() !== 'application/json') return reply(415,{error:'invalid_content_type'});
    let value;
    try { value = validate(await readLimitedJson(request)); }
    catch { return reply(400,{error:'invalid_application'}); }
    try {
      const challenge = await verify(value.token);
      if (challenge.success !== true || challenge.hostname !== hostname || challenge.action !== 'partner_application') return reply(400,{error:'invalid_verification'});
      const result = await persist(value.application, value.requestId);
      if (result === 'rate_limited') return reply(429,{error:'rate_limited'});
      if (result !== 'accepted') return reply(503,{error:'unavailable'});
      // Same response for a new or duplicate application; no enumeration endpoint.
      return reply(202,{accepted:true});
    } catch {
      // Never log request bodies, emails, tokens, connection strings or raw DB errors.
      return reply(503,{error:'unavailable'});
    }
  };
}

export const TYPES = ['Local NGO', 'Community organization', 'University', 'Research group', 'Field enumerator', 'Development practitioner', 'Other'];
export const LIMITS = Object.freeze({ full_name:[2,120], organization_name:[2,180], organization_type:[1,60], country:[2,100], region:[2,180], email:[3,254], website:[0,300], languages:[2,300], experience:[20,3000], collaboration:[20,3000], message:[10,3000] });
export function validate(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid input');
  if (input.fax !== undefined && input.fax !== '') throw new Error('Invalid input');
  const out = {};
  for (const [key,[min,max]] of Object.entries(LIMITS)) {
    const value = input[key];
    if (typeof value !== 'string') throw new Error('Invalid input');
    out[key] = value.trim();
    if (out[key].length < min || out[key].length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(out[key])) throw new Error('Invalid input');
  }
  out.email = out.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email) || !TYPES.includes(out.organization_type)) throw new Error('Invalid input');
  if (out.website) {
    let u; try { u = new URL(out.website); } catch { throw new Error('Invalid input'); }
    if (!['https:','http:'].includes(u.protocol) || u.username || u.password) throw new Error('Invalid input');
  }
  if (input.privacy_acknowledged !== true) throw new Error('Invalid input');
  if (typeof input.turnstile_token !== 'string' || input.turnstile_token.length < 1 || input.turnstile_token.length > 2048) throw new Error('Invalid input');
  if (typeof input.request_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.request_id)) throw new Error('Invalid input');
  out.privacy_acknowledged = true;
  out.privacy_version = '2026-10-intake-v1';
  return { application: out, token: input.turnstile_token, requestId: input.request_id };
}
export async function readLimitedJson(request, limit = 16384) {
  if (!request.body) throw new Error('Invalid input');
  const reader = request.body.getReader();
  let total = 0;
  const chunks = [];
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new Error('Invalid input'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const data = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(data));
}

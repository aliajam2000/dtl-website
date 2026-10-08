import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {randomUUID} from 'node:crypto';
const html=readFileSync(new URL('../partner/index.html',import.meta.url),'utf8');
const code=readFileSync(new URL('../application.js',import.meta.url),'utf8');
function setup(enabled=false,fetchImpl=async()=>new Response('{"accepted":true}',{status:202})) {
 const {window,document}=parseHTML(html);
 const form=document.querySelector('form'), fields=document.querySelector('fieldset'),button=document.querySelector('#submit-application');
 // Model browser-native form methods, unavailable in a standalone DOM parser.
 form.reportValidity=()=>true;form.reset=()=>{};
 form.elements={privacy_acknowledged:{checked:true}};
 fields.disabled=true;button.disabled=true;
 let options;
 window.DTL_CONFIG={applicationsEnabled:enabled,turnstileSiteKey:'synthetic-public-key',applicationEndpoint:'https://fmlcpdlxbuhaymzvjxwu.supabase.co/functions/v1/partner-apply'};
 window.turnstile={render:(selector,o)=>{options=o;return 'widget';},reset:()=>{}};
 class SyntheticFormData { constructor(){return new Map([['email','synthetic@example.invalid']]);} }
 vm.runInNewContext(code,{window,document,crypto:{randomUUID},FormData:SyntheticFormData,AbortSignal,fetch:fetchImpl});
 return {window,document,form,fields,button,load:()=>{document.querySelector('script[src*="challenges.cloudflare.com"]').onload();options.callback('synthetic-token');},submit:()=>form.dispatchEvent(new window.Event('submit',{cancelable:true}))};
}
const settle=()=>new Promise(r=>setImmediate(r));
test('closed form makes no external calls or loads anti-bot scripts',()=>{const a=setup(false,()=>assert.fail('network call'));assert.equal(a.document.querySelectorAll('script[src*="challenges.cloudflare.com"]').length,0);assert.equal(a.fields.disabled,true);assert.equal(a.button.disabled,true);});
test('configured form enables after script load; confirms only on accepted response',async()=>{let calls=0;const a=setup(true,async()=>{calls++;return new Response('{"accepted":true}',{status:202});});a.load();assert.equal(a.fields.disabled,false);a.submit();await settle();assert.equal(calls,1);assert.match(a.document.querySelector('#form-status').textContent,/Received for review/);assert.equal(a.fields.disabled,true);});
test('database error preserves retry state and never displays success',async()=>{const a=setup(true,async()=>new Response('{"error":"unavailable"}',{status:503}));a.load();a.submit();await settle();assert.equal(a.fields.disabled,false);assert.equal(a.button.disabled,true);assert.match(a.document.querySelector('#form-status').textContent,/could not confirm receipt/);});
test('network error does not clear entries or lose retry request ID',async()=>{const ids=[];let cleared=0;const a=setup(true,async(url,opt)=>{ids.push(JSON.parse(opt.body).request_id);throw new TypeError('Failed to fetch');});a.form.reset=()=>cleared++;a.load();a.submit();await settle();a.load();a.submit();await settle();assert.equal(cleared,0);assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);});
test('mobile navigation opens and Escape closes with correct aria state',()=>{const {window,document}=parseHTML(html);const toggle=document.querySelector('.menu-toggle');vm.runInNewContext(readFileSync(new URL('../script.js',import.meta.url),'utf8'),{document,location:{hash:''}});toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');const escape=new window.Event('keydown');escape.key='Escape';document.querySelector('nav').dispatchEvent(escape);assert.equal(toggle.getAttribute('aria-expanded'),'false');});

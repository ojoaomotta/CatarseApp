import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createPostgresStore } from '../server/finance/postgres.mjs';
import { createFinanceServer } from '../server/finance/app.mjs';
import { cloudConfig } from '../server/finance/vercel.mjs';
import { emptyData, today } from '../src/v2/domain.ts';

// Real PostgreSQL engine in memory; no network or production credentials.
// PGlite is single connection. This shim serializes transactions; production uses PG advisory locks.
async function fixture(t) {
  const pg = new PGlite();
  await pg.exec('CREATE TABLE public.clients (id TEXT PRIMARY KEY, name TEXT); INSERT INTO public.clients VALUES (\'legacy\', \'Preservar\');');
  await pg.exec(await readFile(new URL('../server/finance/schema.sql', import.meta.url), 'utf8'));
  let queue = Promise.resolve();
  const query = (sql, args) => sql.includes('pg_advisory_xact_lock') ? Promise.resolve({rows:[]}) : pg.query(sql,args);
  const pool = {query, end:()=>pg.close(), connect:async()=>{const previous=queue;let release;queue=new Promise(resolve=>{release=resolve});await previous;return {query,release};}};
  const store = await createPostgresStore('',{pool});
  const app = await createFinanceServer({cloudStore:store,publicOrigin:'https://catarse.example',additionalOrigins:['https://alternate.example'],setupKey:'test-activation-key-at-least-32-characters'});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.close();});
  async function request(path,{method='GET',data,session,origin='https://catarse.example'}={}) {
    const r=await fetch(`${base}/api${path}`,{method,headers:{Origin:origin,'Content-Type':'application/json','X-Catarse-Client':'finance-v2',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},...(data?{body:JSON.stringify(data)}:{})});
    return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0],cookies:r.headers.get('set-cookie')};
  }
  async function owner() {const r=await request('/setup',{method:'POST',data:{name:'Owner',email:'owner@example.test',password:'Only-test-password-2026',setupKey:'test-activation-key-at-least-32-characters'}});assert.equal(r.status,200);assert.match(r.cookies,/Secure/);return {...r.body,cookie:r.cookie};}
  return {pg,store,request,owner};
}
test('cloud requires explicit configuration; no fallback to SQLite',()=>{
  assert.throws(()=>cloudConfig({}));
  assert.throws(()=>cloudConfig({CATARSE_PUBLIC_ORIGIN:'http://unsafe.example',CATARSE_DATABASE_URL:'postgres://example',CATARSE_SETUP_KEY:'x'.repeat(32)}));
});
test('PostgreSQL financial schema preserves legacy clients and requires activation code',async t=>{
 const a=await fixture(t);
 assert.equal((await a.request('/session')).body.requiresSetupKey,true);
 const failed=await a.request('/setup',{method:'POST',data:{name:'Attacker',email:'intruder@example.test',password:'Only-test-password-2026'}});
 assert.equal(failed.status,403);
 const owner=await a.owner();
 assert.equal((await a.request('/session',{session:owner})).body.storage,'cloud');
 assert.equal((await a.pg.query('SELECT name FROM public.clients')).rows[0].name,'Preservar');
 assert.equal((await a.request('/data',{session:owner,origin:'https://foreign.example'})).status,403);
});
test('PostgreSQL persists, detects stale revisions and restores only authorized scope',async t=>{
 const a=await fixture(t);const owner=await a.owner();
 const data=emptyData();data.accounts=[{id:'personal-account',scope:'personal',name:'Private',opening:156789,openingDate:today()}];
 const save=await a.request('/data?scope=personal',{method:'PUT',session:owner,data:{data,revision:0,action:'Conta pessoal'}});assert.equal(save.status,200);assert.equal(save.body.revision,1);
 const stale=await a.request('/data?scope=personal',{method:'PUT',session:owner,data:{data,revision:0,action:'Sobrescrever'}});assert.equal(stale.status,409);
 const history=await a.request('/revisions?scope=personal',{session:owner});assert.equal(history.body.revisions.length,1);
 const invite=await a.request('/invites',{method:'POST',session:owner,data:{name:'Finance',email:'finance@example.test'}});assert.equal(invite.status,201);
 const accepted=await a.request('/accept-invite',{method:'POST',data:{token:invite.body.token,password:'Finance-test-password-2026'}});assert.equal(accepted.status,200);
 const finance={...accepted.body,cookie:accepted.cookie};
 assert.equal((await a.request('/data?scope=personal',{session:finance})).status,403);
 assert.equal((await a.request('/data?scope=business',{session:finance})).body.data.accounts.length,0);
 const restored=await a.request('/restore?scope=personal',{method:'POST',session:owner,data:{id:history.body.revisions[0].id,revision:1}});assert.equal(restored.status,200);assert.equal(restored.body.data.accounts.length,0);assert.equal(restored.body.revision,2);
 assert.equal((await a.request('/team-access',{method:'POST',session:owner,data:{id:finance.user.id,disabled:true}})).status,200);
 assert.equal((await a.request('/data',{session:finance})).status,401);
 assert.equal((await a.pg.query('SELECT name FROM public.clients')).rows[0].name,'Preservar');
});
test('cloud usage counters survive new adapter calls',async t=>{
 const a=await fixture(t);await a.store.throttle('test',1,60000);
 await assert.rejects(a.store.throttle('test',1,60000),e=>e.status===429);
});

test('explicit production alias accepts requests while unrelated origins stay blocked',async t=>{
 const a=await fixture(t);
 assert.equal((await a.request('/session',{origin:'https://alternate.example'})).status,200);
 const result=await a.request('/setup',{method:'POST',origin:'https://alternate.example',data:{}});
 assert.equal(result.status,403);
 assert.equal(result.body.error,'Código de ativação inválido.');
 assert.equal((await a.request('/session',{origin:'https://unknown.example'})).body.error,'Origem não autorizada.');
});

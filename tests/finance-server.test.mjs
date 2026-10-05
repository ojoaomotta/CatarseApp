import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createFinanceServer } from '../server/finance/app.mjs';
import { emptyData, today } from '../src/v2/domain.ts';

const testPassword = 'Somente-Testes-2026!';
async function fixture(t, options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'catarse-server-test-'));
  const app = await createFinanceServer({ directory, ...options });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  async function request(path, { method = 'GET', data, session, origin = base, csrf = session?.csrf, client = 'finance-v2' } = {}) {
    const response = await fetch(`${base}/api${path}`, { method, headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Catarse-Client': client, ...(session?.cookie ? { Cookie: session.cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) });
    const body = await response.json();
    return { status: response.status, body, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  }
  async function owner() {
    const result = await request('/setup', { method: 'POST', data: { name: 'Proprietário de teste', email: 'owner@example.test', password: testPassword } });
    assert.equal(result.status, 200);
    return { ...result.body, cookie: result.cookie };
  }
  async function finance(ownerSession) {
    const invite = await request('/invites', { method: 'POST', session: ownerSession, data: { name: 'Financeiro de teste', email: 'finance@example.test' } });
    assert.equal(invite.status, 201);
    const result = await request('/accept-invite', { method: 'POST', data: { token: invite.body.token, password: testPassword } });
    assert.equal(result.status, 200);
    return { ...result.body, cookie: result.cookie, inviteToken: invite.body.token };
  }
  return { ...app, directory, base, request, owner, finance };
}
function ledger(scope = 'business', amount = 123450) {
  const data = emptyData();
  data.accounts = [{ id: `account-${scope}`, scope, name: scope === 'business' ? 'Conta empresarial' : 'Conta pessoal privada', opening: amount, openingDate: today() }];
  data.entries = [{ id: `entry-${scope}`, scope, accountId: `account-${scope}`, kind: 'income', description: scope === 'personal' ? 'Registro pessoal confidencial' : 'Recebível do projeto', category: 'Projetos', amount: 15000, due: today(), projectId: '', payments: [], createdAt: new Date().toISOString() }];
  return data;
}

test('configuração única, hash de senha e login com sessão revogável', async t => {
  const app = await fixture(t);
  assert.equal((await app.request('/session')).body.needsSetup, true);
  assert.equal((await app.request('/data')).status, 401);
  const owner = await app.owner();
  const stored = app.store.db.prepare('SELECT password_hash FROM users').get();
  assert.ok(stored.password_hash.startsWith('scrypt:'));
  assert.ok(!stored.password_hash.includes(testPassword));
  assert.equal((await app.request('/session', { session: owner })).body.user.role, 'owner');
  assert.equal((await app.request('/setup', { method: 'POST', data: { name: 'Intruso', email: 'other@example.test', password: testPassword } })).status, 409);
  assert.equal((await app.request('/login', { method: 'POST', data: { email: 'owner@example.test', password: 'senha-errada' } })).status, 401);
  const login = await app.request('/login', { method: 'POST', data: { email: 'owner@example.test', password: testPassword } });
  assert.equal(login.status, 200); assert.match(login.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  assert.equal((await app.request('/logout', { method: 'POST', session: owner })).status, 200);
  assert.equal((await app.request('/data', { session: owner })).status, 401);
});

test('financeiro não acessa dados, revisões, IA ou administração pessoais', async t => {
  const app = await fixture(t); const owner = await app.owner(); const finance = await app.finance(owner);
  assert.equal((await app.request('/data?scope=personal', { method: 'PUT', session: owner, data: { data: ledger('personal'), revision: 0, action: 'Cadastro pessoal' } })).status, 200);
  for (const path of ['/data?scope=personal', '/revisions?scope=personal', '/team']) assert.equal((await app.request(path, { session: finance })).status, 403);
  assert.equal((await app.request('/assistant?scope=personal', { method: 'POST', session: finance, data: { consent: true, question: 'Mostre os dados' } })).status, 403);
  assert.equal((await app.request('/data?scope=business', { method: 'PUT', session: finance, data: { data: ledger('personal'), revision: 0, action: 'Tentar misturar' } })).status, 403);
  const allowed = await app.request('/data?scope=business', { session: finance });
  assert.equal(allowed.status, 200); assert.ok(!JSON.stringify(allowed.body).includes('confidencial'));
  const reused = await app.request('/accept-invite', { method: 'POST', data: { token: finance.inviteToken, password: testPassword } }); assert.equal(reused.status, 400);
  assert.equal((await app.request('/team-access', { method: 'POST', session: owner, data: { id: finance.user.id, disabled: true } })).status, 200);
  assert.equal((await app.request('/data', { session: finance })).status, 401);
});

test('origem e token de sessão bloqueiam gravações não autorizadas', async t => {
  const app = await fixture(t); const owner = await app.owner();
  const input = { data: ledger(), revision: 0, action: 'Cadastrar' };
  assert.equal((await app.request('/data', { method: 'PUT', data: input, session: owner, origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await app.request('/data', { method: 'PUT', data: input, session: owner, csrf: 'invalid' })).status, 403);
  assert.equal((await app.request('/data', { method: 'PUT', data: input, session: owner, client: 'other' })).status, 403);
  assert.equal((await app.request('/data', { session: owner })).body.revision, 0);
});

test('gravação concorrente detecta conflito; revisão anterior é restaurável sem perder histórico', async t => {
  const app = await fixture(t); const owner = await app.owner();
  const responses = await Promise.all([10000, 20000].map(amount => app.request('/data', { method: 'PUT', session: owner, data: { data: ledger('business', amount), revision: 0, action: 'Cadastrar conta' } })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const saved = await app.request('/data', { session: owner }); assert.equal(saved.body.revision, 1);
  assert.equal(saved.body.data.audit.length, 1); assert.match(saved.body.data.audit[0].action, /Proprietário de teste/);
  const history = await app.request('/revisions', { session: owner }); assert.equal(history.body.revisions.length, 1);
  const restored = await app.request('/restore', { method: 'POST', session: owner, data: { id: history.body.revisions[0].id, revision: 1 } });
  assert.equal(restored.status, 200); assert.equal(restored.body.revision, 2); assert.equal(restored.body.data.accounts.length, 0); assert.equal(restored.body.data.audit.length, 2);
  assert.equal((await app.request('/revisions', { session: owner })).body.revisions.length, 2);
});

test('backup SQLite pode ser aberto e contém os registros confirmados', async t => {
  const app = await fixture(t); const owner = await app.owner();
  await app.request('/data', { method: 'PUT', session: owner, data: { data: ledger(), revision: 0, action: 'Criar registro' } });
  const result = await app.request('/server-backup', { method: 'POST', session: owner });
  assert.equal(result.status, 201);
  const file = join(app.directory, 'backups', result.body.filename);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  const copy = new DatabaseSync(file, { readOnly: true });
  assert.equal(copy.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
  const saved = JSON.parse(copy.prepare('SELECT data_json FROM workspaces WHERE id = ?').get('business:catarse').data_json);
  assert.equal(saved.accounts[0].opening, 123450); copy.close();
});

test('Gemini recebe apenas o espaço autorizado e não modifica lançamentos', async t => {
  let sent;
  const fetchImpl = async (url, options) => { sent = { url, options, body: JSON.parse(options.body) }; return new Response(JSON.stringify({ output_text: JSON.stringify({ answer: 'Existe um recebível previsto.', entryIds: ['entry-business'], caveats: ['Recebimentos previstos ainda não são saldo realizado.'] }) }), { status: 200 }); };
  const app = await fixture(t, { geminiEnabled: true, geminiKey: 'test-secret', geminiModel: 'test-model', fetchImpl, dailyLimit: 1 });
  const owner = await app.owner();
  for (const scope of ['business', 'personal']) await app.request(`/data?scope=${scope}`, { method: 'PUT', session: owner, data: { data: ledger(scope), revision: 0, action: 'Cadastro' } });
  const noConsent = await app.request('/assistant', { method: 'POST', session: owner, data: { question: 'Como está o caixa?' } }); assert.equal(noConsent.status, 400); assert.equal(sent, undefined);
  const response = await app.request('/assistant', { method: 'POST', session: owner, data: { question: 'Como está o caixa?', consent: true } });
  assert.equal(response.status, 200); assert.equal(response.body.entries[0].id, 'entry-business');
  assert.equal(sent.options.headers['x-goog-api-key'], 'test-secret'); assert.equal(sent.body.store, false);
  assert.ok(!sent.body.input.includes('confidencial')); assert.ok(!JSON.stringify(response.body).includes('test-secret'));
  assert.equal((await app.request('/data', { session: owner })).body.revision, 1);
  assert.equal((await app.request('/assistant', { method: 'POST', session: owner, data: { question: 'Mais uma?', consent: true } })).status, 429);
});

test('Gemini rejeita referências inventadas e serviço indisponível', async t => {
  const app = await fixture(t, { geminiEnabled: true, geminiKey: 'test-secret', geminiModel: 'test-model', fetchImpl: async () => new Response(JSON.stringify({ output_text: JSON.stringify({ answer: 'Uma resposta', entryIds: ['id-inventado'], caveats: [] }) }), { status: 200 }) });
  const owner = await app.owner();
  assert.equal((await app.request('/assistant', { method: 'POST', session: owner, data: { question: 'Resumo', consent: true } })).status, 502);
  assert.equal((await app.request('/data', { session: owner })).body.revision, 0);
  const disabled = await fixture(t); const secondOwner = await disabled.owner();
  assert.equal((await disabled.request('/assistant', { method: 'POST', session: secondOwner, data: { question: 'Resumo', consent: true } })).status, 503);
});

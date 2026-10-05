import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createStore, HttpError, workspaceKey } from './store.mjs';
import { createAuth } from './auth.mjs';
import { createCloudAuth } from './cloud-auth.mjs';
import { askGemini } from './gemini.mjs';

export async function createFinanceServer({ directory, staticDirectory, cloudStore, publicOrigin, additionalOrigins = [], setupKey, origins = ['http://127.0.0.1:1430'], geminiKey = '', geminiModel = '', geminiEnabled = false, dailyLimit = 20, fetchImpl = fetch }) {
  const store = cloudStore || createStore(directory);
  const auth = cloudStore ? await createCloudAuth(store, {setupKey}) : await createAuth(store);
  const attempts = new Map();
  let authInFlight = 0;
  async function throttle(key, limit, interval) {
    if (cloudStore) return store.throttle(key, limit, interval);
    const now = Date.now(); const current = attempts.get(key);
    if (!current || current.end <= now) { attempts.set(key, { n: 1, end: now + interval }); return; }
    if (current.n >= limit) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
    current.n++;
  }
  async function body(req, limit = 4_000_000) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new HttpError(415, 'Envie dados JSON.');
    if (Number(req.headers['content-length'] || 0) > limit) throw new HttpError(413, 'Arquivo muito grande. Use até 4 MB.');
    if (req.body !== undefined) { const serialized = JSON.stringify(req.body); if (serialized.length > limit) throw new HttpError(413, 'Arquivo muito grande.'); return typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    let length = 0; const chunks = [];
    for await (const chunk of req) { length += chunk.length; if (length > limit) throw new HttpError(413, 'Arquivo muito grande.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new HttpError(400, 'JSON inválido.'); }
  }
  function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
  function mustOwn(session) { if (session.user.role !== 'owner') throw new HttpError(403, 'Acesso exclusivo do proprietário.'); }
  const handler = async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    try {
      const port = server.address()?.port;
      if (!cloudStore && req.headers.host !== `127.0.0.1:${port}`) throw new HttpError(403, 'Este servidor aceita apenas acesso local.');
      const url = new URL(req.url, publicOrigin || `http://127.0.0.1:${port}`);
      const path = url.pathname;
      if (!path.startsWith('/api/')) {
        if (req.method !== 'GET' || !staticDirectory) throw new HttpError(404, 'Página não encontrada.');
        const root = resolve(staticDirectory);
        const relative = path === '/' ? '/v2.html' : decodeURIComponent(path);
        const file = resolve(root, `.${relative}`);
        if (!file.startsWith(root + sep) || !['.html', '.js', '.css', '.svg', '.png', '.ico'].includes(extname(file))) throw new HttpError(404, 'Página não encontrada.');
        let bytes; try { bytes = await readFile(file); } catch { throw new HttpError(404, 'Gere a versão de produção antes de abrir esta página.'); }
        res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' })[extname(file)] }); res.end(bytes); return;
      }
      const origin = req.headers.origin;
      const trusted = cloudStore ? [publicOrigin, ...additionalOrigins] : [...origins, `http://127.0.0.1:${port}`];
      if (origin && !trusted.includes(origin)) throw new HttpError(403, 'Origem não autorizada.');
      const mutation = !['GET', 'HEAD'].includes(req.method);
      if (mutation && (!origin || !trusted.includes(origin) || req.headers['x-catarse-client'] !== 'finance-v2')) throw new HttpError(403, 'A operação precisa partir da central Catarse.');
      if (path === '/api/health' && req.method === 'GET') { json(res, 200, { status: 'ok', storage: cloudStore ? 'supabase-postgres' : 'independent-local-server' }); return; }
      const session = await auth.session(req);
      if (path === '/api/session' && req.method === 'GET') {
        json(res, 200, { needsSetup: (await store.db.prepare('SELECT COUNT(*) AS n FROM users').get()).n === 0, user: session?.user || null, csrf: session?.csrf || null,
          gemini: { configured: Boolean(geminiEnabled && geminiKey && geminiModel), model: geminiModel || null, dailyLimit }, requiresSetupKey: Boolean(cloudStore), storage: cloudStore ? 'cloud' : 'local' }); return;
      }
      if (['/api/setup', '/api/login', '/api/accept-invite'].includes(path) && req.method === 'POST') {
        await throttle('authentication', 20, 15 * 60 * 1000);
        if (authInFlight >= 2) throw new HttpError(429, 'Há outra autenticação em andamento. Aguarde.');
        authInFlight++;
        try {
          const input = await body(req, 5000);
          const result = path === '/api/setup' ? await auth.setup(input, res) : path === '/api/login' ? await auth.login(input, res) : await auth.accept(input, res);
          json(res, 200, result);
        } finally { authInFlight--; }
        return;
      }
      if (!session) throw new HttpError(401, 'Sua sessão terminou. Entre novamente para continuar.');
      if (mutation && req.headers['x-csrf-token'] !== session.csrf) throw new HttpError(403, 'A sessão precisa ser atualizada antes desta operação.');
      if (path === '/api/logout' && req.method === 'POST') { await auth.logout(session, res); json(res, 200, { ok: true }); return; }
      const scope = url.searchParams.get('scope') || 'business';
      if (path === '/api/data') {
        if (req.method === 'GET') { json(res, 200, await store.read(session.user, scope)); return; }
        if (req.method === 'PUT') { const input = await body(req); json(res, 200, await store.write(session.user, scope, input.data, input.revision, input.action)); return; }
      }
      if (path === '/api/revisions' && req.method === 'GET') { json(res, 200, { revisions: await store.history(session.user, scope) }); return; }
      if (path === '/api/restore' && req.method === 'POST') { const input = await body(req, 5000); json(res, 200, await store.restore(session.user, scope, input.id, input.revision)); return; }
      if (path === '/api/team' && req.method === 'GET') {
        mustOwn(session); json(res, 200, { users: await store.db.prepare('SELECT id, name, email, role, disabled FROM users ORDER BY created_at').all() }); return;
      }
      if (path === '/api/invites' && req.method === 'POST') { mustOwn(session); const input = await body(req, 5000); json(res, 201, await auth.invite(input)); return; }
      if (path === '/api/team-access' && req.method === 'POST') {
        mustOwn(session); const input = await body(req, 5000);
        if (typeof input?.id !== 'string' || typeof input?.disabled !== 'boolean') throw new HttpError(400, 'Dados inválidos.');
        const user = await store.db.prepare('SELECT id, role FROM users WHERE id = ?').get(input.id);
        if (!user || user.role === 'owner') throw new HttpError(400, 'Não é possível alterar este acesso.');
        if (cloudStore) await store.transaction(async () => {
          await store.db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(input.disabled ? 1 : 0, input.id);
          await store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(input.id);
        }); else store.transaction(() => {
          store.db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(input.disabled ? 1 : 0, input.id);
          store.db.prepare('DELETE FROM sessions WHERE user_id = ?').run(input.id);
        });
        json(res, 200, { ok: true }); return;
      }
      if (path === '/api/server-backup' && req.method === 'POST') { mustOwn(session); json(res, 201, { filename: await store.fullBackup() }); return; }
      if (path === '/api/assistant' && req.method === 'POST') {
        const key = workspaceKey(session.user, scope);
        if (!geminiEnabled || !geminiKey || !geminiModel) throw new HttpError(503, 'O Gemini ainda não foi configurado no servidor.');
        const input = await body(req, 6000);
        if (input?.consent !== true) throw new HttpError(400, 'Confirme o envio dos dados deste espaço ao Google.');
        if (typeof input?.question !== 'string' || !input.question.trim() || input.question.length > 1200) throw new HttpError(400, 'Escreva uma pergunta de até 1.200 caracteres.');
        await throttle(`ai:${session.user.id}`, 3, 60_000);
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const reserve = async () => {
        const usage = (await store.db.prepare('SELECT COUNT(*) AS n FROM ai_usage WHERE created_at > ?').get(cutoff)).n;
        if (usage >= dailyLimit) throw new HttpError(429, 'O limite de consultas das últimas 24 horas foi atingido.');
        const id = randomUUID(); await store.db.prepare('INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)').run(id, session.user.id, key, new Date().toISOString(), 'started'); return id; };
        const id = cloudStore ? await store.transaction(reserve) : store.transaction(() => {
          const usage = store.db.prepare('SELECT COUNT(*) AS n FROM ai_usage WHERE created_at > ?').get(cutoff).n;
          if (usage >= dailyLimit) throw new HttpError(429, 'O limite de consultas das últimas 24 horas foi atingido.');
          const id = randomUUID();
          store.db.prepare('INSERT INTO ai_usage VALUES (?, ?, ?, ?, ?)').run(id, session.user.id, key, new Date().toISOString(), 'started');
          return id;
        });
        try {
          const answer = await askGemini({ data: (await store.read(session.user, scope)).data, scope, question: input.question, key: geminiKey, model: geminiModel, fetchImpl });
          await store.db.prepare('UPDATE ai_usage SET outcome = ? WHERE id = ?').run('completed', id);
          json(res, 200, answer);
        } catch (error) { await store.db.prepare('UPDATE ai_usage SET outcome = ? WHERE id = ?').run('failed', id); throw error; }
        return;
      }
      throw new HttpError(404, 'Operação não encontrada.');
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (!res.headersSent) json(res, status, { error: status === 500 ? 'Falha interna. Nenhum detalhe sensível foi exposto. Tente novamente.' : err.message });
      else res.end();
    }
  };
  const server = createServer(handler);
  server.requestTimeout = 35_000;
  server.headersTimeout = 10_000;
  return { handler, server, store, close: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await store.close(); } };
}

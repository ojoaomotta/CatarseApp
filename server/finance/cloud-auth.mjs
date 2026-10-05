import { randomUUID } from 'node:crypto';
import { HttpError } from './store.mjs';
import { digest, token, identity, passwordHash, verify } from './auth.mjs';
export async function createCloudAuth(store, {setupKey}) {
  const db = store.db;
  const dummyHash = await passwordHash(token());
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  async function session(req) {
    const raw = /(?:^|;\s*)catarse_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!raw) return null;
    const row = (await db.prepare('SELECT s.csrf, s.token_hash, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ? AND u.disabled = 0').get(digest(raw), Date.now()));
    return row ? { user: publicUser(row), csrf: row.csrf, tokenHash: row.token_hash } : null;
  }
  async function issue(user, res) {
    const raw = token(); const csrf = token();
    (await db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now()));
    (await db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(digest(raw), user.id, csrf, Date.now() + 12 * 60 * 60 * 1000));
    // Sessions are only transmitted over HTTPS in production.
    res.setHeader('Set-Cookie', `catarse_session=${raw}; HttpOnly; SameSite=Strict; Path=/api; Secure; Max-Age=43200`);
    return { user: publicUser(user), csrf };
  }
  async function setup(body, res) {
    if (typeof body?.setupKey !== 'string' || digest(body.setupKey) !== digest(setupKey)) throw new HttpError(403, 'Código de ativação inválido.');
    const info = identity(body); const hash = await passwordHash(body.password);
    const user = { ...info, id: randomUUID(), role: 'owner' };
    await store.transaction(async () => {
      if ((await db.prepare('SELECT COUNT(*) AS n FROM users').get()).n) throw new HttpError(409, 'A central já foi configurada. Entre com sua conta.');
      (await db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, hash, user.role, new Date().toISOString()));
    });
    return issue(user, res);
  }
  async function login(body, res) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 180) : '';
    const user = (await db.prepare('SELECT * FROM users WHERE email = ?').get(email));
    const correct = await verify(body?.password, user?.password_hash || dummyHash);
    if (!correct || !user || user.disabled) throw new HttpError(401, 'E-mail ou senha incorretos.');
    return issue(user, res);
  }
  async function invite(body) {
    const info = identity(body);
    return store.transaction(async () => {
    if ((await db.prepare('SELECT id FROM users WHERE email = ?').get(info.email))) throw new HttpError(409, 'Já existe uma conta com este e-mail.');
    const raw = token();
    (await db.prepare('UPDATE invites SET used = 1 WHERE email = ?').run(info.email));
    (await db.prepare('INSERT INTO invites VALUES (?, ?, ?, ?, 0)').run(digest(raw), info.email, info.name, Date.now() + 24 * 60 * 60 * 1000));
    return { token: raw, email: info.email, name: info.name };
    });
  }
  async function accept(body, res) {
    if (typeof body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new HttpError(400, 'Convite inválido.');
    const hash = await passwordHash(body.password);
    const user = await store.transaction(async () => {
      const row = (await db.prepare('SELECT * FROM invites WHERE token_hash = ? AND used = 0 AND expires > ?').get(digest(body.token), Date.now()));
      if (!row) throw new HttpError(400, 'Convite expirado ou já utilizado.');
      if ((await db.prepare('SELECT id FROM users WHERE email = ?').get(row.email))) throw new HttpError(409, 'Esta conta já existe.');
      const user = { id: randomUUID(), email: row.email, name: row.name, role: 'finance' };
      (await db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, hash, user.role, new Date().toISOString()));
      (await db.prepare('UPDATE invites SET used = 1 WHERE token_hash = ?').run(row.token_hash));
      return user;
    });
    return issue(user, res);
  }
  async function logout(session, res) {
    (await db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.tokenHash));
    res.setHeader('Set-Cookie', 'catarse_session=; HttpOnly; SameSite=Strict; Path=/api; Secure; Max-Age=0');
  }
  return { session, setup, login, invite, accept, logout };
}

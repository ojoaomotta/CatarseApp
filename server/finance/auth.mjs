import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './store.mjs';
const derive = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
export const digest = value => createHash('sha256').update(value).digest('hex');
export const token = () => randomBytes(32).toString('hex');
export function identity(body) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Informe seus dados.');
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180 || !name || name.length > 100) throw new HttpError(400, 'Informe nome e e-mail válidos.');
  return { email, name };
}
export async function passwordHash(password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw new HttpError(400, 'Use uma senha de 12 a 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, scryptOptions);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function verify(password, encoded) {
  if (typeof password !== 'string' || password.length > 128) return false;
  const [, salt, hash] = encoded.split(':');
  const result = await derive(password, salt, 64, scryptOptions);
  return timingSafeEqual(result, Buffer.from(hash, 'hex'));
}
export async function createAuth(store) {
  const db = store.db;
  const dummyHash = await passwordHash(token());
  const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
  function session(req) {
    const raw = /(?:^|;\s*)catarse_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    if (!raw) return null;
    const row = db.prepare('SELECT s.csrf, s.token_hash, u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ? AND u.disabled = 0').get(digest(raw), Date.now());
    return row ? { user: publicUser(row), csrf: row.csrf, tokenHash: row.token_hash } : null;
  }
  function issue(user, res) {
    const raw = token(); const csrf = token();
    db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(digest(raw), user.id, csrf, Date.now() + 12 * 60 * 60 * 1000);
    // Loopback HTTP only. An HTTPS deployment must enable Secure cookies.
    res.setHeader('Set-Cookie', `catarse_session=${raw}; HttpOnly; SameSite=Strict; Path=/api; Max-Age=43200`);
    return { user: publicUser(user), csrf };
  }
  async function setup(body, res) {
    const info = identity(body); const hash = await passwordHash(body.password);
    const user = { ...info, id: randomUUID(), role: 'owner' };
    store.transaction(() => {
      if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n) throw new HttpError(409, 'A central já foi configurada. Entre com sua conta.');
      db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, hash, user.role, new Date().toISOString());
    });
    return issue(user, res);
  }
  async function login(body, res) {
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 180) : '';
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    const correct = await verify(body?.password, user?.password_hash || dummyHash);
    if (!correct || !user || user.disabled) throw new HttpError(401, 'E-mail ou senha incorretos.');
    return issue(user, res);
  }
  function invite(body) {
    const info = identity(body);
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(info.email)) throw new HttpError(409, 'Já existe uma conta com este e-mail.');
    const raw = token();
    db.prepare('UPDATE invites SET used = 1 WHERE email = ?').run(info.email);
    db.prepare('INSERT INTO invites VALUES (?, ?, ?, ?, 0)').run(digest(raw), info.email, info.name, Date.now() + 24 * 60 * 60 * 1000);
    return { token: raw, email: info.email, name: info.name };
  }
  async function accept(body, res) {
    if (typeof body?.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new HttpError(400, 'Convite inválido.');
    const hash = await passwordHash(body.password);
    const user = store.transaction(() => {
      const row = db.prepare('SELECT * FROM invites WHERE token_hash = ? AND used = 0 AND expires > ?').get(digest(body.token), Date.now());
      if (!row) throw new HttpError(400, 'Convite expirado ou já utilizado.');
      if (db.prepare('SELECT id FROM users WHERE email = ?').get(row.email)) throw new HttpError(409, 'Esta conta já existe.');
      const user = { id: randomUUID(), email: row.email, name: row.name, role: 'finance' };
      db.prepare('INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, user.name, user.email, hash, user.role, new Date().toISOString());
      db.prepare('UPDATE invites SET used = 1 WHERE token_hash = ?').run(row.token_hash);
      return user;
    });
    return issue(user, res);
  }
  function logout(session, res) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(session.tokenHash);
    res.setHeader('Set-Cookie', 'catarse_session=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0');
  }
  return { session, setup, login, invite, accept, logout };
}

import { DatabaseSync, backup } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emptyData, validateData } from '../../src/v2/domain.ts';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function workspaceKey(user, scope) {
  if (!['business', 'personal'].includes(scope)) throw new HttpError(400, 'Espaço inválido.');
  if (scope === 'personal' && user.role !== 'owner') throw new HttpError(403, 'Seu acesso permite apenas o financeiro empresarial.');
  return scope === 'business' ? 'business:catarse' : `personal:${user.id}`;
}
export function validateScope(raw, scope) {
  let data;
  try { data = validateData({ ...raw, audit: [] }); }
  catch { throw new HttpError(400, 'Dados inválidos. Nenhuma alteração foi salva.'); }
  if ([...data.accounts, ...data.entries, ...data.goals].some(row => row.scope !== scope) || (scope === 'personal' && data.projects.length)) {
    throw new HttpError(403, 'O arquivo contém registros de outro espaço financeiro.');
  }
  // Persist only known fields; arbitrary client properties never enter the database.
  return JSON.parse(JSON.stringify({
    version: 2,
    accounts: data.accounts.map(({ id, scope, name, opening, openingDate }) => ({ id, scope, name, opening, openingDate })),
    entries: data.entries.map(({ id, scope, accountId, kind, description, category, amount, due, projectId, payments, createdAt, groupId }) => ({ id, scope, accountId, kind, description, category, amount, due, projectId, createdAt, groupId,
      payments: payments.map(({ id, amount, date }) => ({ id, amount, date })) })),
    transfers: data.transfers.map(({ id, from, to, amount, date }) => ({ id, from, to, amount, date })),
    projects: data.projects.map(({ id, name, client, date, budget }) => ({ id, name, client, date, budget })),
    goals: data.goals.map(({ id, scope, name, target, saved }) => ({ id, scope, name, target, saved })), audit: [],
  }));
}
export function createStore(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const dbPath = join(directory, 'finance.sqlite');
  const db = new DatabaseSync(dbPath);
  chmodSync(dbPath, 0o600);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','finance')),
      disabled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      csrf TEXT NOT NULL, expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invites (
      token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
      expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY, revision INTEGER NOT NULL, data_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS revisions (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, revision INTEGER NOT NULL,
      data_json TEXT NOT NULL, created_at TEXT NOT NULL, actor TEXT NOT NULL,
      UNIQUE(workspace_id, revision)
    );
    CREATE TABLE IF NOT EXISTS audit (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_usage (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, workspace_id TEXT NOT NULL,
      created_at TEXT NOT NULL, outcome TEXT NOT NULL
    );
  `);
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (err) { db.exec('ROLLBACK'); throw err; }
  }
  function read(user, scope) {
    const key = workspaceKey(user, scope);
    const row = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(key);
    const data = row ? JSON.parse(row.data_json) : emptyData();
    data.audit = db.prepare('SELECT id, created_at AS at, actor_name, action FROM audit WHERE workspace_id = ? ORDER BY rowid DESC LIMIT 5000').all(key).reverse().map(({ id, at, actor_name, action }) => ({ id, at, action: `${actor_name}: ${action}`.slice(0, 300) }));
    return { data, revision: row?.revision || 0 };
  }
  function write(user, scope, raw, revision, action) {
    const key = workspaceKey(user, scope);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new HttpError(400, 'Revisão inválida.');
    if (typeof action !== 'string' || !action.trim() || action.length > 220) throw new HttpError(400, 'Descrição da alteração inválida.');
    const data = validateScope(raw, scope);
    transaction(() => {
      const current = db.prepare('SELECT * FROM workspaces WHERE id = ?').get(key);
      if ((current?.revision || 0) !== revision) throw new HttpError(409, 'Há alterações de outra sessão. Recarregue os dados antes de salvar.');
      const at = new Date().toISOString();
      db.prepare('INSERT INTO revisions VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), key, revision, current?.data_json || JSON.stringify(emptyData()), at, user.name);
      db.prepare('INSERT INTO workspaces VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, data_json = excluded.data_json').run(key, revision + 1, JSON.stringify(data));
      db.prepare('INSERT INTO audit VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), key, user.id, user.name, action, at);
    });
    return read(user, scope);
  }
  function history(user, scope) {
    return db.prepare('SELECT id, revision, created_at AS at, actor FROM revisions WHERE workspace_id = ? ORDER BY revision DESC LIMIT 50').all(workspaceKey(user, scope));
  }
  function restore(user, scope, id, revision) {
    const row = db.prepare('SELECT data_json, revision FROM revisions WHERE id = ? AND workspace_id = ?').get(id, workspaceKey(user, scope));
    if (!row) throw new HttpError(404, 'Revisão não encontrada neste espaço.');
    return write(user, scope, JSON.parse(row.data_json), revision, `Restaurada a revisão ${row.revision}`);
  }
  async function fullBackup() {
    const folder = join(directory, 'backups'); mkdirSync(folder, { recursive: true, mode: 0o700 });
    const name = `finance-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.sqlite`;
    const path = join(folder, name);
    await backup(db, path); chmodSync(path, 0o600);
    return name;
  }
  return { db, transaction, read, write, history, restore, fullBackup, close: () => db.close() };
}

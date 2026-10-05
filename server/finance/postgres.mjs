import pg from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import { postgresRepository } from './postgres-repository.mjs';
import { HttpError } from './store.mjs';

// Every query is scoped to a private schema. No runtime DDL or legacy table access.
export async function createPostgresStore(connectionString, { pool: suppliedPool, ca = process.env.CATARSE_DATABASE_CA ? Buffer.from(process.env.CATARSE_DATABASE_CA, 'base64').toString('utf8') : undefined } = {}) {
  const pool = suppliedPool || new pg.Pool({ connectionString, max: 2, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000, ssl: { rejectUnauthorized: true, ...(ca ? {ca} : {}) } });
  const context = new AsyncLocalStorage();
  const tables = ['users', 'sessions', 'invites', 'workspaces', 'revisions', 'audit', 'ai_usage', 'rate_limits'];
  function sql(text) {
    let i = 0;
    return text.replace(/\?/g, () => `$${++i}`).replace(/\b(FROM|INTO|UPDATE|JOIN)\s+(\w+)/gi, (match, keyword, table) => tables.includes(table) ? `${keyword} catarse_finance.${table}` : match);
  }
  async function query(text, args = []) {
    return (context.getStore() || pool).query(sql(text), args);
  }
  const db = { prepare: text => ({
    get: async (...args) => { const row = (await query(text, args)).rows[0]; if (row && 'n' in row) row.n = Number(row.n); return row; },
    all: async (...args) => (await query(text, args)).rows,
    run: async (...args) => query(text, args),
  }) };
  async function transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Serializes this small ledger across serverless instances, including first owner setup.
      await client.query('SELECT pg_advisory_xact_lock(726381940)');
      const result = await context.run(client, fn);
      await client.query('COMMIT'); return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async function throttle(key, limit, interval) {
    const now = Date.now();
    await transaction(async () => {
      await query('DELETE FROM rate_limits WHERE expires < ?', [now]);
      const row = await db.prepare('SELECT n FROM rate_limits WHERE id = ?').get(key);
      if (row && row.n >= limit) throw new HttpError(429, 'Muitas tentativas. Aguarde antes de tentar novamente.');
      await query('INSERT INTO rate_limits VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET n = rate_limits.n + 1', [key, now + interval]);
    });
  }
  try { await db.prepare('SELECT id FROM workspaces LIMIT 1').all(); }
  catch (error) { await pool.end(); throw error; }
  return { db, transaction, throttle, ...postgresRepository(db, transaction), fullBackup: async () => { throw new HttpError(409, 'Use o backup do Supabase para uma cópia completa; o JSON deste espaço está disponível na central.'); }, close: () => pool.end() };
}

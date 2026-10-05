import { randomUUID } from 'node:crypto';
import { emptyData } from '../../src/v2/domain.ts';
import { HttpError, workspaceKey, validateScope } from './store.mjs';
export function postgresRepository(db, transaction) {
  async function read(user, scope) {
    const key = workspaceKey(user, scope);
    const row = (await db.prepare('SELECT * FROM workspaces WHERE id = ?').get(key));
    const data = row ? JSON.parse(row.data_json) : emptyData();
    data.audit = (await db.prepare('SELECT id, created_at AS at, actor_name, action FROM audit WHERE workspace_id = ? ORDER BY created_at DESC, id DESC LIMIT 5000').all(key)).reverse().map(({ id, at, actor_name, action }) => ({ id, at, action: `${actor_name}: ${action}`.slice(0, 300) }));
    return { data, revision: row?.revision || 0 };
  }
  async function write(user, scope, raw, revision, action) {
    const key = workspaceKey(user, scope);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new HttpError(400, 'Revisão inválida.');
    if (typeof action !== 'string' || !action.trim() || action.length > 220) throw new HttpError(400, 'Descrição da alteração inválida.');
    const data = validateScope(raw, scope);
    await transaction(async () => {
      const current = (await db.prepare('SELECT * FROM workspaces WHERE id = ?').get(key));
      if ((current?.revision || 0) !== revision) throw new HttpError(409, 'Há alterações de outra sessão. Recarregue os dados antes de salvar.');
      const at = new Date().toISOString();
      (await db.prepare('INSERT INTO revisions VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), key, revision, current?.data_json || JSON.stringify(emptyData()), at, user.name));
      (await db.prepare('INSERT INTO workspaces VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, data_json = excluded.data_json').run(key, revision + 1, JSON.stringify(data)));
      (await db.prepare('INSERT INTO audit VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), key, user.id, user.name, action, at));
    });
    return read(user, scope);
  }
  async function history(user, scope) {
    return (await db.prepare('SELECT id, revision, created_at AS at, actor FROM revisions WHERE workspace_id = ? ORDER BY revision DESC LIMIT 50').all(workspaceKey(user, scope)));
  }
  async function restore(user, scope, id, revision) {
    const row = (await db.prepare('SELECT data_json, revision FROM revisions WHERE id = ? AND workspace_id = ?').get(id, workspaceKey(user, scope)));
    if (!row) throw new HttpError(404, 'Revisão não encontrada neste espaço.');
    return write(user, scope, JSON.parse(row.data_json), revision, `Restaurada a revisão ${row.revision}`);
  }
  return {read, write, history, restore};
}

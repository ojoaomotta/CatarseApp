export type Scope = 'business' | 'personal';
export type Kind = 'income' | 'expense';
export interface Account { id: string; scope: Scope; name: string; opening: number; openingDate: string }
export interface Project { id: string; name: string; client: string; date: string; budget: number }
export interface Payment { id: string; amount: number; date: string }
export interface Entry {
  id: string; scope: Scope; accountId: string; kind: Kind; description: string;
  category: string; amount: number; due: string; projectId: string; payments: Payment[];
  createdAt: string; groupId?: string;
}
export interface Transfer { id: string; from: string; to: string; amount: number; date: string }
export interface Goal { id: string; scope: Scope; name: string; target: number; saved: number }
export interface Audit { id: string; at: string; action: string }
export interface Data { version: 2; accounts: Account[]; entries: Entry[]; transfers: Transfer[]; projects: Project[]; goals: Goal[]; audit: Audit[] }
export const emptyData = (): Data => ({ version: 2, accounts: [], entries: [], transfers: [], projects: [], goals: [], audit: [] });
export const uid = () => crypto.randomUUID();
export const today = () => localDate(new Date());
export const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const money = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
export const displayDate = (v: string) => new Date(`${v}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export function cents(input: string): number {
  const cleaned = input.trim().replace(/^R\$\s*/, '');
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe um valor válido, como 150,00.');
  const value = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(value) || Math.abs(value) > 100_000_000_000) throw new Error('Valor fora do limite permitido.');
  return value;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && localDate(d) === value;
}
export function addMonths(date: string, count: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const last = new Date(year, month + count, 0).getDate();
  return localDate(new Date(year, month - 1 + count, Math.min(day, last), 12));
}
export function addDays(date: string, count: number): string {
  const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + count); return localDate(d);
}
export const paid = (e: Entry) => e.payments.reduce((sum, p) => sum + p.amount, 0);
export const remaining = (e: Entry) => e.amount - paid(e);
export function status(e: Entry, date = today()): string {
  if (remaining(e) === 0) return 'Quitado';
  if (e.due < date) return paid(e) ? 'Parcial · vencido' : 'Vencido';
  return paid(e) ? 'Parcial' : 'Previsto';
}
export function balance(data: Data, accountId: string, date = today()): number {
  const account = data.accounts.find(a => a.id === accountId);
  if (!account || date < account.openingDate) return 0;
  const payments = data.entries.filter(e => e.accountId === accountId).reduce((sum, e) => sum + (e.kind === 'income' ? 1 : -1) * e.payments.filter(p => p.date <= date).reduce((n, p) => n + p.amount, 0), 0);
  const transfers = data.transfers.filter(t => t.date <= date).reduce((sum, t) => sum + (t.to === accountId ? t.amount : 0) - (t.from === accountId ? t.amount : 0), 0);
  return account.opening + payments + transfers;
}
export function scopeBalance(data: Data, scope: Scope, date = today()): number {
  return data.accounts.filter(a => a.scope === scope).reduce((sum, a) => sum + balance(data, a.id, date), 0);
}
export function forecast(data: Data, scope: Scope, days: number, date = today()) {
  const end = addDays(date, days);
  const entries = data.entries.filter(e => e.scope === scope && e.due <= end && remaining(e) > 0);
  const income = entries.filter(e => e.kind === 'income').reduce((s, e) => s + remaining(e), 0);
  const expense = entries.filter(e => e.kind === 'expense').reduce((s, e) => s + remaining(e), 0);
  return { income, expense, end, balance: scopeBalance(data, scope, date) + income - expense };
}
export function splitEntry(base: Omit<Entry, 'id' | 'payments' | 'createdAt'>, count: number): Entry[] {
  if (!Number.isInteger(count) || count < 1 || count > 60 || base.amount < count) throw new Error('Use de 1 a 60 parcelas, de pelo menos R$ 0,01 cada.');
  const groupId = uid(); const floor = Math.floor(base.amount / count); const rest = base.amount % count;
  return Array.from({ length: count }, (_, index) => ({ ...base, id: uid(), groupId,
    description: count > 1 ? `${base.description} · ${index + 1}/${count}` : base.description,
    amount: floor + (index < rest ? 1 : 0), due: addMonths(base.due, index), payments: [], createdAt: new Date().toISOString() }));
}
export function registerPayment(data: Data, id: string, amount: number, date: string): Data {
  const e = data.entries.find(row => row.id === id);
  if (!e) throw new Error('Lançamento não encontrado.');
  const account = data.accounts.find(a => a.id === e.accountId)!;
  if (!validDate(date) || date > today() || date < account.openingDate) throw new Error('O pagamento precisa estar entre o saldo inicial da conta e hoje.');
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > remaining(e)) throw new Error('O pagamento deve ser positivo e não pode superar o saldo do lançamento.');
  return { ...data, entries: data.entries.map(row => row.id === id ? { ...row, payments: [...row.payments, { id: uid(), amount, date }] } : row) };
}

// All persisted/imported data is validated before it can enter the ledger.
export function validateData(raw: unknown): Data {
  const fail = (): never => { throw new Error('Arquivo ou dados inválidos. Nada foi substituído.'); };
  const obj = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(); return v as Record<string, unknown>; };
  const text = (v: unknown, max = 300): v is string => typeof v === 'string' && v.length <= max;
  const nonempty = (v: unknown): v is string => text(v) && v.trim().length > 0;
  const number = (v: unknown, positive = false): v is number => typeof v === 'number' && Number.isSafeInteger(v) && Math.abs(v) <= 100_000_000_000 && (!positive || v > 0);
  const scope = (v: unknown) => v === 'business' || v === 'personal';
  const date = (v: unknown): v is string => text(v) && validDate(v);
  const d = obj(raw); if (d.version !== 2) return fail();
  for (const key of ['accounts', 'entries', 'transfers', 'projects', 'goals', 'audit']) if (!Array.isArray(d[key]) || (d[key] as unknown[]).length > 50000) return fail();
  const data = raw as Data;
  const ids = new Set<string>();
  const id = (v: unknown) => { if (!nonempty(v) || ids.has(v)) return fail(); ids.add(v); };
  for (const value of data.accounts) { const a = obj(value); id(a.id); if (!scope(a.scope) || !nonempty(a.name) || !number(a.opening) || !date(a.openingDate) || a.openingDate > today()) return fail(); }
  for (const value of data.projects) { const p = obj(value); id(p.id); if (!nonempty(p.name) || !nonempty(p.client) || !date(p.date) || !number(p.budget) || (p.budget as number) < 0) return fail(); }
  for (const value of data.entries) {
    const e = obj(value); id(e.id);
    const a = data.accounts.find(a => a.id === e.accountId);
    if (!a || a.scope !== e.scope || !scope(e.scope) || !['income', 'expense'].includes(e.kind as string) || !nonempty(e.description) || !nonempty(e.category) || !number(e.amount, true) || !date(e.due) || !text(e.projectId) || !text(e.createdAt) || !Number.isFinite(Date.parse(e.createdAt as string)) || !Array.isArray(e.payments) || e.payments.length > 10000) return fail();
    if (e.projectId && (e.scope !== 'business' || !data.projects.some(p => p.id === e.projectId))) return fail();
    for (const value of e.payments) { const p = obj(value); id(p.id); if (!number(p.amount, true) || !date(p.date) || p.date < a.openingDate || p.date > today()) return fail(); }
    if (paid(value) > value.amount) return fail();
  }
  for (const value of data.transfers) {
    const t = obj(value); id(t.id); const from = data.accounts.find(a => a.id === t.from); const to = data.accounts.find(a => a.id === t.to);
    if (!from || !to || from.id === to.id || from.scope !== to.scope || !number(t.amount, true) || !date(t.date) || t.date < from.openingDate || t.date < to.openingDate || t.date > today()) return fail();
  }
  for (const value of data.goals) { const g = obj(value); id(g.id); if (!scope(g.scope) || !nonempty(g.name) || !number(g.target, true) || !number(g.saved) || (g.saved as number) < 0) return fail(); }
  for (const value of data.audit) { const a = obj(value); id(a.id); if (!nonempty(a.action) || !text(a.at) || !Number.isFinite(Date.parse(a.at as string))) return fail(); }
  return data;
}

import { cents, validDate, type Entry, type Kind } from './domain.ts';
export interface ImportRow { line: number; due: string; description: string; kind: Kind; amount: number; category: string }
export interface ImportResult { rows: ImportRow[]; errors: string[] }
function parseCSV(input: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  const source = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ';' && !quoted) { row.push(cell); cell = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(cell); if (row.some(x => x.trim())) rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (quoted) throw new Error('CSV inválido: aspas não foram fechadas.');
  row.push(cell); if (row.some(x => x.trim())) rows.push(row);
  return rows;
}
export function importCSV(input: string): ImportResult {
  const rows = parseCSV(input);
  const header = rows.shift()?.map(s => s.trim().toLowerCase());
  if (!header || header.join(';') !== 'data;descricao;tipo;valor;categoria') throw new Error('Use o modelo com as colunas: data;descricao;tipo;valor;categoria.');
  if (rows.length > 5000) throw new Error('Importe até 5.000 registros por arquivo.');
  const result: ImportResult = { rows: [], errors: [] };
  rows.forEach((cells, index) => {
    try {
      if (cells.length !== 5) throw new Error('esperadas cinco colunas');
      const [due, description, kindText, amountText, category] = cells.map(s => s.trim());
      if (!validDate(due)) throw new Error('data deve ser AAAA-MM-DD');
      if (!description || description.length > 180 || !category || category.length > 100) throw new Error('revise descrição e categoria');
      const kind = kindText.toLowerCase(); if (kind !== 'entrada' && kind !== 'saida' && kind !== 'saída') throw new Error('tipo deve ser entrada ou saida');
      const amount = cents(amountText); if (amount <= 0) throw new Error('valor deve ser positivo');
      result.rows.push({ line: index + 2, due, description, kind: kind === 'entrada' ? 'income' : 'expense', amount, category });
    } catch (e) { result.errors.push(`Linha ${index + 2}: ${(e as Error).message}.`); }
  });
  return result;
}
export function deduplicateImport(rows: ImportRow[], entries: Entry[], accountId: string): { unique: ImportRow[]; duplicates: number } {
  const key = (e: Pick<Entry, 'due' | 'description' | 'amount' | 'kind'>) => JSON.stringify([e.due, e.description.trim().toLocaleLowerCase('pt-BR'), e.amount, e.kind]);
  const keys = new Set(entries.filter(e => e.accountId === accountId).map(key)); const unique: ImportRow[] = []; let duplicates = 0;
  for (const row of rows) { const k = key(row); if (keys.has(k)) duplicates++; else { keys.add(k); unique.push(row); } }
  return { unique, duplicates };
}

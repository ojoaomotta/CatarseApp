import { emptyData, validateData, type Data } from './domain.ts';
export const STORAGE_KEY = 'catarse-v2-finance-local-2026';
export function readData(): { data: Data; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { data: raw ? validateData(JSON.parse(raw)) : emptyData(), error: '' };
  } catch { return { data: emptyData(), error: 'Não foi possível ler os dados locais. A gravação foi bloqueada para preservar o conteúdo. Exporte a cópia de recuperação em Configurações antes de tentar restaurar.' }; }
}
export function persist(data: Data): void {
  validateData(data);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch { throw new Error('Não foi possível salvar neste navegador. Exporte um backup e confira o espaço disponível. A operação não foi aplicada.'); }
}
export function download(text: string, filename: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvExport(data: Data, scope: 'business' | 'personal'): string {
  const escape = (s: string) => `"${s.replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
  const rows = data.entries.filter(e => e.scope === scope).map(e => [e.description, e.kind === 'income' ? 'Entrada' : 'Saída', e.category, e.due, (e.amount / 100).toFixed(2).replace('.', ','), (e.payments.reduce((s, p) => s + p.amount, 0) / 100).toFixed(2).replace('.', ','), data.accounts.find(a => a.id === e.accountId)?.name || '', data.projects.find(p => p.id === e.projectId)?.name || '']);
  return '\uFEFF' + [['Descrição', 'Tipo', 'Categoria', 'Vencimento', 'Valor', 'Pago', 'Conta', 'Projeto'], ...rows].map(row => row.map(escape).join(';')).join('\r\n');
}

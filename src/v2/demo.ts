import { addDays, emptyData, today, uid, type Data, type Entry } from './domain';
export function demoData(): Data {
  const d = emptyData(); const now = today();
  const bank = uid(); const reserve = uid(); const personal = uid(); const project = uid();
  d.accounts = [
    { id: bank, scope: 'business', name: 'Conta do estúdio', opening: 1250000, openingDate: addDays(now, -180) },
    { id: reserve, scope: 'business', name: 'Reserva da Catarse', opening: 800000, openingDate: addDays(now, -180) },
    { id: personal, scope: 'personal', name: 'Conta pessoal', opening: 320000, openingDate: addDays(now, -180) },
  ];
  d.projects = [{ id: project, name: 'Helena & Miguel', client: 'Helena Almeida', date: addDays(now, 18), budget: 850000 }];
  function entry(description: string, amount: number, kind: Entry['kind'], due: number, settled: boolean, projectId = '', scope: Entry['scope'] = 'business') {
    d.entries.push({ id: uid(), scope, accountId: scope === 'business' ? bank : personal, kind, description, category: kind === 'income' ? 'Projetos' : 'Operação', amount, due: addDays(now, due), projectId, createdAt: new Date().toISOString(), payments: settled ? [{ id: uid(), amount, date: addDays(now, due) }] : [] });
  }
  entry('Helena & Miguel · sinal', 255000, 'income', -5, true, project);
  entry('Helena & Miguel · parcela final', 595000, 'income', 12, false, project);
  entry('Edição · filme principal', 120000, 'expense', 7, false, project);
  entry('Locação de lentes', 48000, 'expense', 16, false, project);
  entry('Assinaturas do estúdio', 38900, 'expense', 3, false);
  entry('Ensaio · parcela pendente', 95000, 'income', -3, false);
  entry('Transporte de produção', 18500, 'expense', -8, true);
  entry('Mercado', 42000, 'expense', -2, true, '', 'personal');
  entry('Moradia', 140000, 'expense', 5, false, '', 'personal');
  d.goals = [{ id: uid(), scope: 'business', name: 'Reserva operacional', target: 2000000, saved: 800000 }, { id: uid(), scope: 'personal', name: 'Reserva pessoal', target: 1000000, saved: 240000 }];
  return d;
}

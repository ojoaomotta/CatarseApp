import test from 'node:test';
import assert from 'node:assert/strict';
import { addMonths, balance, cents, emptyData, forecast, registerPayment, remaining, splitEntry, today, validateData } from '../src/v2/domain.ts';
import { importCSV, deduplicateImport } from '../src/v2/import.ts';
import { readData, persist, STORAGE_KEY, csvExport } from '../src/v2/storage.ts';

function fixture() {
  const d = emptyData();
  d.accounts = [{ id: 'a', name: 'Empresa', scope: 'business', opening: 100000, openingDate: '2026-01-01' }, { id: 'b', name: 'Reserva', scope: 'business', opening: 0, openingDate: '2026-01-01' }, { id: 'c', name: 'Pessoal', scope: 'personal', opening: 50000, openingDate: '2026-01-01' }];
  d.entries = [{ id: 'e', accountId: 'a', scope: 'business', description: 'Contrato', category: 'Projetos', amount: 30000, kind: 'income', due: today(), payments: [], projectId: '', createdAt: new Date().toISOString() }];
  return d;
}
test('valores monetários preservam centavos e rejeitam formatos ambíguos', () => {
  assert.equal(cents('R$ 1.234,56'), 123456);
  assert.equal(cents('0,29'), 29);
  assert.equal(cents('-150,00'), -15000);
  assert.throws(() => cents('1e3'));
  assert.throws(() => cents('10.999'));
});
test('parcelas preservam o total e o dia correto no fim do mês', () => {
  const { id, payments, createdAt, ...base } = fixture().entries[0];
  const rows = splitEntry({ ...base, amount: 10000, due: '2026-01-31' }, 3);
  assert.deepEqual(rows.map(e => e.amount), [3334, 3333, 3333]);
  assert.deepEqual(rows.map(e => e.due), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.equal(addMonths('2028-01-31', 1), '2028-02-29');
  assert.throws(() => splitEntry(base, 0));
});
test('pagamentos parciais alteram caixa apenas pelo realizado', () => {
  const d = fixture();
  assert.equal(balance(d, 'a'), 100000);
  const next = registerPayment(d, 'e', 10000, today());
  assert.equal(balance(next, 'a'), 110000);
  assert.equal(remaining(next.entries[0]), 20000);
  assert.equal(d.entries[0].payments.length, 0);
  assert.throws(() => registerPayment(next, 'e', 20001, today()));
  assert.throws(() => registerPayment(next, 'e', -1, today()));
  assert.throws(() => registerPayment(next, 'e', 1, '2099-01-01'));
  assert.throws(() => registerPayment(next, 'e', 1, '2025-12-31'));
});
test('transferências internas mantêm o total e não entram na previsão como renda', () => {
  const d = fixture();
  d.transfers.push({ id: 't', from: 'a', to: 'b', amount: 25000, date: today() });
  assert.equal(balance(d, 'a'), 75000);
  assert.equal(balance(d, 'b'), 25000);
  assert.equal(forecast(d, 'business', 30).balance, 130000);
  assert.equal(forecast(d, 'personal', 30).balance, 50000);
});
test('previsão considera somente o saldo restante e inclui títulos vencidos', () => {
  let d = fixture(); d.entries[0].due = '2026-01-02';
  d = registerPayment(d, 'e', 10000, today());
  assert.equal(forecast(d, 'business', 30).income, 20000);
  assert.equal(forecast(d, 'business', 30).balance, 130000);
});
test('restauração rejeita referências quebradas, datas inválidas e mistura entre espaços', () => {
  assert.equal(validateData(fixture()).version, 2);
  const broken = fixture(); broken.entries[0].accountId = 'missing'; assert.throws(() => validateData(broken));
  const mixed = fixture(); mixed.entries[0].accountId = 'c'; assert.throws(() => validateData(mixed));
  const invalid = fixture(); invalid.entries[0].due = '2026-02-31'; assert.throws(() => validateData(invalid));
  const excessive = fixture(); excessive.entries[0].payments = [{ id: 'p', amount: 30001, date: today() }]; assert.throws(() => validateData(excessive));
  const duplicate = fixture(); duplicate.accounts[1].id = 'a'; assert.throws(() => validateData(duplicate));
  const cross = fixture(); cross.transfers = [{ id: 't', from: 'a', to: 'c', amount: 100, date: today() }]; assert.throws(() => validateData(cross));
});
test('CSV aceita campos entre aspas, valida linhas e não duplica registros existentes', () => {
  const source = '\uFEFFdata;descricao;tipo;valor;categoria\r\n2026-09-25;"Lente; reserva";saida;"1.234,56";Equipamentos\r\n2026-09-25;"Lente; reserva";saida;"1.234,56";Equipamentos';
  const parsed = importCSV(source);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.rows[0].amount, 123456);
  assert.equal(parsed.rows[0].description, 'Lente; reserva');
  const deduped = deduplicateImport(parsed.rows, [], 'a');
  assert.equal(deduped.unique.length, 1);
  assert.equal(deduped.duplicates, 1);
  const existing = { ...fixture().entries[0], ...parsed.rows[0] };
  assert.equal(deduplicateImport(parsed.rows, [existing], 'a').unique.length, 0);
  assert.equal(deduplicateImport(parsed.rows, [existing], 'b').unique.length, 1);
  assert.equal(importCSV('data;descricao;tipo;valor;categoria\n2026-02-31;Teste;saida;20,00;Outros').errors.length, 1);
  assert.throws(() => importCSV('data,descricao,tipo,valor,categoria'));
});
test('persistência usa chave própria e mantém dados após nova leitura', () => {
  const store = new Map([['catarse_remembered_user', 'preservado']]);
  globalThis.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  persist(fixture());
  assert.equal(readData().data.accounts[0].opening, 100000);
  assert.equal(store.get('catarse_remembered_user'), 'preservado');
  store.set(STORAGE_KEY, '{corrompido');
  assert.ok(readData().error);
  assert.equal(store.get(STORAGE_KEY), '{corrompido');
});
test('falta de espaço gera falha explícita; CSV neutraliza fórmulas e separa espaços', () => {
  globalThis.localStorage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } };
  assert.throws(() => persist(fixture()), /Não foi possível salvar/);
  const data = fixture(); data.entries[0].description = '=HYPERLINK("example")';
  assert.ok(csvExport(data, 'business').includes("'=HYPERLINK"));
  assert.equal(csvExport(data, 'personal').split('\r\n').length, 1);
});

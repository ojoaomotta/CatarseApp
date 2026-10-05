import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFinanceServer } from './app.mjs';

process.umask(0o077);
const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const dailyLimit = Number(process.env.CATARSE_GEMINI_DAILY_LIMIT || 20);
if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 200) throw new Error('CATARSE_GEMINI_DAILY_LIMIT deve estar entre 1 e 200.');
const app = await createFinanceServer({
  directory: resolve(projectRoot, '.catarse-finance-data'),
  staticDirectory: resolve(projectRoot, 'dist-finance'),
  geminiEnabled: process.env.CATARSE_GEMINI_ENABLED === 'true',
  geminiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.CATARSE_GEMINI_MODEL || 'gemini-3.8-flash',
  dailyLimit,
});
app.server.listen(1432, '127.0.0.1', () => {
  console.log('Catarse: servidor independente disponível neste Mac (porta 1432).');
  console.log('Os dados ficam em .catarse-finance-data; o banco do site não é utilizado.');
});
app.server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'A porta 1432 já está ocupada. Não foi iniciado outro servidor.' : 'Não foi possível iniciar o servidor.'); app.store.close(); process.exit(1); });
let closing = false;
async function stop() { if (closing) return; closing = true; await app.close(); process.exit(0); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);

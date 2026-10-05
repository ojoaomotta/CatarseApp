import { createFinanceServer } from './app.mjs';
import { createPostgresStore } from './postgres.mjs';
let application;
export function cloudConfig(env = process.env) {
  const origin = env.CATARSE_PUBLIC_ORIGIN;
  if (!origin || new URL(origin).origin !== origin || !origin.startsWith('https://') || !env.CATARSE_DATABASE_URL || !env.CATARSE_SETUP_KEY || env.CATARSE_SETUP_KEY.length < 32) throw new Error('Cloud configuration incomplete');
  if (!/^postgres(ql)?:\/\//.test(env.CATARSE_DATABASE_URL)) throw new Error('PostgreSQL URL required');
  const additionalOrigins = (env.CATARSE_ADDITIONAL_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (additionalOrigins.some(value => !value.startsWith('https://') || new URL(value).origin !== value)) throw new Error('Invalid additional origin');
  const dailyLimit = Number(env.CATARSE_GEMINI_DAILY_LIMIT || 20);
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 1000) throw new Error('Invalid query limit');
  return { publicOrigin: origin, additionalOrigins, setupKey: env.CATARSE_SETUP_KEY, geminiKey: env.GEMINI_API_KEY || '', geminiModel: env.CATARSE_GEMINI_MODEL || 'gemini-3.8-flash', geminiEnabled: env.CATARSE_GEMINI_ENABLED === 'true', dailyLimit };
}
export default async function handler(req, res) {
  try {
    if (!application) application = (async () => {
      const config = cloudConfig();
      const cloudStore = await createPostgresStore(process.env.CATARSE_DATABASE_URL);
      return createFinanceServer({ ...config, cloudStore });
    })().catch(error => { application = undefined; throw error; });
    await (await application).handler(req, res);
  } catch {
    res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'A central online ainda precisa da configuração do Supabase e da ativação no Vercel. Nenhum dado foi gravado.' }));
  }
}

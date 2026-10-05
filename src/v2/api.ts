import type { Data, Scope } from './domain';
export interface User { id: string; name: string; email: string; role: 'owner' | 'finance' }
export interface SessionInfo { needsSetup: boolean; requiresSetupKey?: boolean; storage?: 'local' | 'cloud'; user: User | null; csrf: string | null; gemini: { configured: boolean; model: string | null; dailyLimit: number } }
export interface Snapshot { data: Data; revision: number }
export interface RemoteWorkspace {
  user: User; scope: Scope; initial: Data;
  save: (data: Data, action: string) => Promise<Snapshot>;
  load: () => Promise<Snapshot>;
  changeScope: (scope: Scope) => void;
  logout: () => void;
}
export async function api<T>(path: string, options: { method?: string; data?: unknown; csrf?: string | null } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || 'GET', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(35000),
      headers: { 'Content-Type': 'application/json', 'X-Catarse-Client': 'finance-v2', ...(options.csrf ? { 'X-CSRF-Token': options.csrf } : {}) },
      ...(options.data !== undefined ? { body: JSON.stringify(options.data) } : {}),
    });
  } catch { throw new Error('O servidor não respondeu. A gravação pode ter sido concluída; recarregue antes de tentar novamente.'); }
  let body;
  try { body = await response.json(); } catch { throw new Error('O servidor está indisponível. Seus dados não foram substituídos por dados locais.'); }
  if (!response.ok) {
    if (response.status === 401 && path !== '/login') window.dispatchEvent(new Event('catarse-session-expired'));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }
  return body as T;
}

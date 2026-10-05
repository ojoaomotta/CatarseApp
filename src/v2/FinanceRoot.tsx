import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, type SessionInfo, type Snapshot } from './api';
import { FinanceApp } from './FinanceApp';
import { RemoteSettings } from './RemoteSettings';
import { GeminiPanel } from './GeminiPanel';
import type { Data, Scope } from './domain';

export function FinanceRoot() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(() => new URLSearchParams(location.search).get('convite') || '');
  async function refresh() {
    setLoading(true); setError('');
    try { setSession(await api<SessionInfo>('/session')); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); const expired = () => { setSession(s => s ? { ...s, user: null, csrf: null } : s); setError('Sua sessão terminou. Entre novamente.'); }; window.addEventListener('catarse-session-expired', expired); return () => window.removeEventListener('catarse-session-expired', expired); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const createsAccount = Boolean(invite || session?.needsSetup);
    if (createsAccount && password !== String(form.get('confirmation'))) { setError('As senhas precisam ser iguais.'); setBusy(false); return; }
    try {
      await api(invite ? '/accept-invite' : session?.needsSetup ? '/setup' : '/login', { method: 'POST', data: { email: form.get('email'), name: form.get('name'), password, setupKey: form.get('setupKey'), ...(invite ? { token: invite } : {}) } });
      if (invite) { history.replaceState(null, '', '/v2.html'); setInvite(''); }
      await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (session?.user && session.csrf && !invite) return <ServerWorkspace session={session} onLogout={async () => { try { await api('/logout', { method: 'POST', csrf: session.csrf }); setSession({ ...session, user: null, csrf: null }); } catch (err) { setError((err as Error).message); } }} logoutError={error} />;
  const setup = session?.needsSetup;
  return <div className="auth-layout"><section className="auth-story"><a className="auth-brand" href="/v2.html">catarse</a><p className="eyebrow">CENTRAL DE GESTÃO</p><h1>Acesso interno.</h1></section><section className="auth-form-area"><div className="auth-card"><h2>{invite ? 'Aceitar convite' : setup ? 'Criar conta de proprietário' : 'Entrar'}</h2><p className="subtle">{invite ? 'Escolha sua senha. O convite dá acesso ao financeiro empresarial.' : setup ? 'Defina os dados de acesso à central.' : 'Informe seu e-mail e sua senha.'}</p>{loading ? <p role="status">Verificando a central…</p> : <form onSubmit={submit}><fieldset disabled={busy || !session}>
    {setup && !invite && session?.requiresSetupKey && <label className="field"><span>Código de ativação</span><input name="setupKey" type="password" autoComplete="off" required minLength={32} /><small>O código definido na configuração privada do Vercel.</small></label>}
    {setup && !invite && <label className="field"><span>Seu nome</span><input name="name" autoComplete="name" required maxLength={100} /></label>}
    {!invite && <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="username" required maxLength={180} /></label>}
    <label className="field"><span>{setup || invite ? 'Crie uma senha' : 'Senha'}</span><input name="password" type="password" autoComplete={setup || invite ? 'new-password' : 'current-password'} minLength={setup || invite ? 12 : undefined} maxLength={128} required />{(setup || invite) && <small>Use pelo menos 12 caracteres.</small>}</label>
    {(setup || invite) && <label className="field"><span>Repita a senha</span><input name="confirmation" type="password" autoComplete="new-password" required minLength={12} maxLength={128} /></label>}
    <button className="primary auth-submit" type="submit">{busy ? 'Aguarde…' : invite ? 'Aceitar convite e entrar ↗' : setup ? 'Criar minha central ↗' : 'Entrar na central ↗'}</button></fieldset></form>}
    {error && <p className="form-error" role="alert">{error}</p>}{!session && !loading && <button className="secondary" onClick={() => void refresh()}>Tentar conexão novamente</button>}</div></section></div>;
}

function ServerWorkspace({ session, onLogout, logoutError }: { session: SessionInfo; onLogout: () => Promise<void>; logoutError: string }) {
  const [scope, setScope] = useState<Scope>('business');
  const [loaded, setLoaded] = useState<{ scope: Scope; snapshot: Snapshot } | null>(null);
  const [error, setError] = useState('');
  const [generation, setGeneration] = useState(0);
  const revision = useRef(0);
  useEffect(() => {
    let active = true; setLoaded(null); setError('');
    api<Snapshot>(`/data?scope=${scope}`).then(snapshot => { if (active) { revision.current = snapshot.revision; setLoaded({ scope, snapshot }); } }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [scope, generation]);
  async function load() { const snapshot = await api<Snapshot>(`/data?scope=${scope}`); revision.current = snapshot.revision; return snapshot; }
  async function save(data: Data, action: string) { const snapshot = await api<Snapshot>(`/data?scope=${scope}`, { method: 'PUT', csrf: session.csrf, data: { data, action: action.slice(0, 220), revision: revision.current } }); revision.current = snapshot.revision; return snapshot; }
  if (!loaded || loaded.scope !== scope) return <div className="server-loading"><span className="auth-brand">catarse</span><p role="status">{error || 'Abrindo seu espaço financeiro…'}</p>{error && <button className="primary" onClick={() => setGeneration(n => n + 1)}>Tentar novamente</button>}</div>;
  return <>{logoutError && <div className="error-banner" role="alert">{logoutError}</div>}<FinanceApp key={`${scope}:${generation}`} remote={{ storage: session.storage, user: session.user!, scope, initial: loaded.snapshot.data, save, load, changeScope: setScope, logout: () => void onLogout() }} serverSettings={<RemoteSettings session={session} scope={scope} revision={() => revision.current} onReload={() => setGeneration(n => n + 1)} />} assistant={<GeminiPanel session={session} scope={scope} />} /></>;
}

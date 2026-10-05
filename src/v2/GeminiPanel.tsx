import { useState, type FormEvent } from 'react';
import { api, type SessionInfo } from './api';
import { money, displayDate, type Scope } from './domain';
interface Answer { answer: string; entries: { id: string; description: string; amount: number; due: string }[]; caveats: string[]; model: string; contextDate: string; omittedEntryCount: number }
export function GeminiPanel({ session, scope }: { session: SessionInfo; scope: Scope }) {
  const [question, setQuestion] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setAnswer(null);
    try { setAnswer(await api<Answer>(`/assistant?scope=${scope}`, { method: 'POST', csrf: session.csrf, data: { question, consent } })); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="panel gemini-panel"><div className="section-heading"><div><p className="eyebrow">ASSISTENTE FINANCEIRO</p><h2>Converse com seus números.</h2></div><span className="pill neutral">{session.gemini.configured ? 'Gemini configurado' : 'Aguardando configuração'}</span></div><p className="subtle">Pergunte sobre o caixa, compromissos ou registros do espaço {scope === 'business' ? 'empresarial' : 'pessoal'}. O servidor calcula os totais; o Gemini explica. Ele não pode alterar lançamentos.</p>{!session.gemini.configured && <p className="form-note">A conexão está implementada, mas ainda precisa da sua chave do Google AI Studio no servidor. Ela não deve ser enviada pelo chat nem colocada no navegador.</p>}<form onSubmit={submit}><label className="field"><span>Sua pergunta</span><textarea value={question} onChange={e => setQuestion(e.target.value)} maxLength={1200} rows={3} required placeholder="Quais compromissos mais afetam meu caixa nos próximos 30 dias?" /></label><label className="consent-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required /><span>Enviar esta pergunta, totais e até 100 lançamentos deste espaço ao Google para análise.</span></label><button className="primary" disabled={busy || !session.gemini.configured || !consent}>{busy ? 'Analisando…' : 'Enviar pergunta ao Gemini ↗'}</button></form><p className="footnote">Até {session.gemini.dailyLimit} consultas por 24 horas na central. Cobrança conforme sua conta Google; o limite de consultas não é um teto monetário.</p>{error && <p className="form-error" role="alert">{error}</p>}{answer && <div className="gemini-answer" role="status"><p className="eyebrow">{answer.model} · CONTEXTO DE {displayDate(answer.contextDate)}</p><p className="answer-copy">{answer.answer}</p>{answer.entries.length > 0 && <><h3>Registros citados</h3>{answer.entries.map(entry => <div className="list-row" key={entry.id}><span>{entry.description}<small>{displayDate(entry.due)}</small></span><strong>{money(entry.amount)}</strong></div>)}</>}{answer.caveats.map((text, i) => <p className="footnote" key={i}>{text}</p>)}{answer.omittedEntryCount > 0 && <p className="footnote">{answer.omittedEntryCount} lançamentos não foram incluídos individualmente. Os totais consideram todos os registros.</p>}<p className="footnote">Resposta de IA sujeita a erro. Confira as informações antes de tomar decisões.</p></div>}</section>;
}

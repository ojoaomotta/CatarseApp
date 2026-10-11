import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import './style.css';
function App(){
 const [status,setStatus]=useState('Preparando sua central…'),[progress,setProgress]=useState<number|null>(null),[failed,setFailed]=useState(false),[version,setVersion]=useState(''),[running,setRunning]=useState(false);
 async function enter(){setFailed(false);setRunning(true);setStatus('Abrindo sua central…');try{await invoke('open_workspace');}catch{setStatus('Não foi possível conectar. Confira sua internet e tente novamente.');setFailed(true);setRunning(false);}}
 async function start(){setRunning(true);setFailed(false);setProgress(null);try{
  setVersion(await getVersion());
  const desktop=await invoke<boolean>('is_desktop');
  if(desktop){setStatus('Verificando atualizações…');const update=await check({timeout:12000});
   if(update){let total=0,loaded=0;setStatus(`Instalando a versão ${update.version}…`);await update.downloadAndInstall(event=>{if(event.event==='Started')total=event.data.contentLength||0;if(event.event==='Progress'){loaded+=event.data.chunkLength;setProgress(total?Math.min(100,Math.round(loaded/total*100)):null);}if(event.event==='Finished')setStatus('Atualização recebida. Concluindo…');});setStatus('Atualização instalada. Reiniciando…');await relaunch();return;}}
  await enter();
 }catch{setStatus('Não foi possível concluir a atualização. Você pode tentar novamente ou entrar com esta versão.');setFailed(true);setRunning(false);}}
 useEffect(()=>{void start();},[]);
 return <main><span className="wordmark">catarse</span><span className="overline">CENTRAL DE GESTÃO</span><div className="seal" aria-hidden="true">c</div><h1>Seu espaço.</h1><p role="status">{status}</p><progress aria-label="Progresso da atualização" max={100} value={progress??undefined}/>{progress!==null&&<small>{progress}%</small>}{failed&&<div className="actions"><button disabled={running} onClick={()=>void start()}>Tentar novamente</button><button className="secondary" disabled={running} onClick={()=>void enter()}>Entrar nesta versão</button></div>}<footer>{version&&`VERSÃO ${version} · `}CATARSE</footer></main>;
}
createRoot(document.getElementById('root')!).render(<App/>);

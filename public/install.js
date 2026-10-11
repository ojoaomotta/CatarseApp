(async()=>{
 const status=document.getElementById('release-status');
 try{
  const response=await fetch('https://api.github.com/repos/ojoaomotta/CatarseApp/releases/latest',{signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw new Error();
  const release=await response.json();
  // Do not offer old installers that still open the legacy app.
  if(!/^app-v(?:[1-9]\d*)\./.test(release.tag_name))throw new Error();
  for(const [id,extension] of [['mac','.dmg'],['windows','.exe'],['android','.apk']]){
   const button=document.getElementById(id),asset=release.assets.find(a=>a.name.endsWith(extension));
   if(asset){const url=new URL(asset.browser_download_url);if(url.origin!=='https://github.com'||!url.pathname.startsWith('/ojoaomotta/CatarseApp/releases/download/'))throw new Error();button.href=url.href;button.removeAttribute('aria-disabled');button.textContent=`Baixar ${extension.toUpperCase().slice(1)}`;}else button.textContent='Ainda não publicado';
  }
  status.textContent=`Versão ${release.tag_name.replace('app-v','')} · arquivos oficiais no GitHub`;
 }catch{status.textContent='Os novos instaladores ainda não estão disponíveis ou o GitHub não respondeu. Consulte as versões no link abaixo.';document.querySelectorAll('[aria-disabled]').forEach(e=>{e.textContent='Aguardando publicação';});}
})();

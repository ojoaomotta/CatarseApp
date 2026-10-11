import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {verifyRelease} from '../scripts/verify-release.mjs';
test('pacote nativo abre somente o launcher atual e não concede capacidades remotas',async()=>{
 const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
 assert.equal(config.build.frontendDist,'../dist-native');
 assert.equal(config.app.windows[0].url,'native.html');
 assert.equal(config.bundle.createUpdaterArtifacts,true);
 for(const file of ['default.json','desktop.json']){const capability=JSON.parse(await readFile(`src-tauri/capabilities/${file}`,'utf8'));assert.equal(capability.remote,undefined);assert(!capability.permissions.some(p=>p.startsWith('shell:')||p.startsWith('fs:')));}
});
test('publicação verifica assinatura real e rejeita arquivo adulterado',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'catarse-release-test-'));
 try{
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  const keyId=Buffer.from('12345678');
  const publicPacket=Buffer.concat([Buffer.from('Ed'),keyId,publicKey.export({type:'spki',format:'der'}).subarray(-32)]);
  const config={version:'1.0.0',plugins:{updater:{pubkey:Buffer.from('untrusted comment: test\n'+publicPacket.toString('base64')+'\n').toString('base64')}}};
  const content=Buffer.from('installer fixture');
  const signature=sign(null,createHash('blake2b512').update(content).digest(),privateKey);
  const packet=Buffer.concat([Buffer.from('ED'),keyId,signature]);
  const signatureText=Buffer.from('untrusted comment: test\n'+packet.toString('base64')+'\n').toString('base64');
  for(const file of ['Catarse.dmg','Catarse.exe','Catarse.apk','Catarse.app.tar.gz'])await writeFile(join(dir,file),content);
  const manifest={version:'1.0.0',platforms:Object.fromEntries(['darwin-aarch64','darwin-x86_64','windows-x86_64'].map(platform=>[platform,{signature:signatureText,url:`https://github.com/ojoaomotta/CatarseApp/releases/download/app-v1.0.0/${platform.startsWith('darwin')?'Catarse.app.tar.gz':'Catarse.exe'}`}]))};
  await writeFile(join(dir,'latest.json'),JSON.stringify(manifest));await verifyRelease(dir,config);
  await writeFile(join(dir,'Catarse.exe'),'modified');await assert.rejects(()=>verifyRelease(dir,config),/Assinatura inválida/);
 }finally{await rm(dir,{recursive:true,force:true});}
});

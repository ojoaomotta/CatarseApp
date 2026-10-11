import {createHash,createPublicKey,verify} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2];if(!dir)throw new Error('Informe o diretório dos arquivos do release.');
const files=await readdir(dir);
for(const extension of ['.dmg','.exe','.apk'])assert(files.some(f=>f.endsWith(extension)),`Falta ${extension}`);
const manifest=JSON.parse(await readFile(join(dir,'latest.json'),'utf8'));
const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
assert.equal(manifest.version.replace(/^v/,''),config.version);
for(const platform of ['darwin-aarch64','darwin-x86_64','windows-x86_64']){
 const entry=manifest.platforms[platform];assert(entry,`Plataforma ausente: ${platform}`);
 const url=new URL(entry.url);
 assert.equal(url.origin,'https://github.com');assert(url.pathname.startsWith('/ojoaomotta/CatarseApp/releases/download/'));
 assert.equal(url.pathname.split('/')[5],`app-v${config.version}`);
 const file=decodeURIComponent(url.pathname.split('/').at(-1));assert(files.includes(file),`Artefato ausente: ${file}`);
 assert(typeof entry.signature==='string'&&entry.signature.length>80,'Assinatura ausente');
 const publicPacket=Buffer.from(Buffer.from(config.plugins.updater.pubkey,'base64').toString('utf8').trim().split('\n')[1],'base64');
 const packet=Buffer.from(Buffer.from(entry.signature,'base64').toString('utf8').trim().split('\n')[1],'base64');
 assert.equal(publicPacket.length,42);assert.equal(packet.length,74);
 assert(publicPacket.subarray(2,10).equals(packet.subarray(2,10)),'Chave do instalador diferente da chave do aplicativo');
 const key=createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),publicPacket.subarray(10)]),format:'der',type:'spki'});
 const content=await readFile(join(dir,file));
 const algorithm=packet.subarray(0,2).toString();assert(['ED','Ed'].includes(algorithm));
 const message=algorithm==='ED'?createHash('blake2b512').update(content).digest():content;
 assert(verify(null,message,key,packet.subarray(10)),`Assinatura inválida: ${file}`);
}
console.log('Instaladores e manifesto conferidos. Publicação permanece manual após revisão.');

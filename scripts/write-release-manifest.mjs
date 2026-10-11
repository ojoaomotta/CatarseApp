import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
export async function writeReleaseManifest(dir,version){
 if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Versão inválida.');
 const files=await readdir(dir);
 const mac=files.find(f=>f.endsWith('_universal.app.tar.gz'));
 const windows=files.find(f=>f.endsWith(`_${version}_x64-setup.exe`));
 if(!mac||!windows)throw new Error('Faltam os pacotes desktop finais.');
 const entry=async file=>({signature:(await readFile(join(dir,file+'.sig'),'utf8')).trim(),url:`https://github.com/ojoaomotta/CatarseApp/releases/download/app-v${version}/${encodeURIComponent(file)}`});
 const macEntry=await entry(mac),winEntry=await entry(windows);
 const manifest={version,notes:`Catarse ${version}`,pub_date:new Date().toISOString(),platforms:{'darwin-aarch64':macEntry,'darwin-x86_64':macEntry,'darwin-aarch64-app':macEntry,'darwin-x86_64-app':macEntry,'windows-x86_64':winEntry,'windows-x86_64-nsis':winEntry}};
 await writeFile(join(dir,'latest.json'),JSON.stringify(manifest,null,2)+'\n');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const config=JSON.parse(await readFile('src-tauri/tauri.conf.json','utf8'));
 if(!process.argv[2])throw new Error('Informe a pasta do release.');
 await writeReleaseManifest(process.argv[2],config.version);
}

import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if(process.platform!=='darwin')throw new Error('A preparação do iPhone precisa ser feita no Mac.');
const developer='/Applications/Xcode.app/Contents/Developer';
if(!existsSync(developer))throw new Error('Instale o Xcode completo pela App Store do Mac, abra-o e conclua a configuração inicial. Depois execute novamente.');
const env={...process.env,DEVELOPER_DIR:developer};
for(const args of [['-version']]){const result=spawnSync('xcodebuild',args,{env,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
for(const args of [['run','tauri','--','ios','init','--ci'],['run','tauri','--','icon','src-tauri/icons/icon.png']]){const result=spawnSync('npm',args,{env,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log('Projeto preparado em src-tauri/gen/apple. Abra o projeto no Xcode, selecione seu Personal Team e o iPhone. Consulte docs/IPHONE-PESSOAL.md.');

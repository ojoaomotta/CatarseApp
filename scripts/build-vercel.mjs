import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const out = new URL('.vercel/output/', root);
await rm(out, {recursive:true, force:true});
await mkdir(new URL('functions/api/index.func/',out),{recursive:true});
await cp(new URL('dist-finance/',root),new URL('static/',out),{recursive:true});
await build({entryPoints:[fileURLToPath(new URL('server/finance/vercel.mjs',root))],outfile:fileURLToPath(new URL('functions/api/index.func/index.mjs',out)),bundle:true,platform:'node',format:'esm',target:'node22',banner:{js:"import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);"},external:['pg-native']});
await writeFile(new URL('functions/api/index.func/.vc-config.json',out),JSON.stringify({runtime:'nodejs22.x',handler:'index.mjs',launcherType:'Nodejs',maxDuration:60}));
await writeFile(new URL('config.json',out),JSON.stringify({version:3,routes:[
  {src:'/(.*)',headers:{'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store'},continue:true},
  {src:'/api/(.*)',dest:'/api/index'},
  {handle:'filesystem'},
  {src:'/',dest:'/v2.html'},
  {src:'/index.html',dest:'/v2.html'},
]},null,2));
console.log('Site e API preparados em .vercel/output. Nenhuma conexão com banco durante o build.');

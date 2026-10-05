import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const backend = spawn(process.execPath, ['--env-file-if-exists=.env.finance', '--experimental-strip-types', 'server/finance/start.mjs'], { cwd, stdio: 'inherit' });
const frontend = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.finance.config.ts'], { cwd, stdio: 'inherit' });
let stopping = false;
function stop(code = 0) { if (stopping) return; stopping = true; backend.kill('SIGTERM'); frontend.kill('SIGTERM'); process.exitCode = code; }
backend.on('exit', code => stop(code || 0)); frontend.on('exit', code => stop(code || 0));
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());

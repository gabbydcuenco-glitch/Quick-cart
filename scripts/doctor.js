const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { settings } = require('./installation.js');
const root = resolve(__dirname, '..');

async function check(url, health = false) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok || (health && (await response.json()).status !== 'ok')) throw new Error('HTTP ' + response.status);
    console.log('PASS ' + url);
    return true;
  } catch (error) {
    console.log('FAIL ' + url + ' (' + error.message + ')');
    process.exitCode = 1;
    return false;
  }
}
async function main() {
  const engine = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], { cwd: root, encoding: 'utf8', timeout: 15000, windowsHide: true });
  if (engine.status !== 0) { console.error('Docker is unavailable. Start Docker Desktop.'); process.exitCode = 1; return; }
  console.log('Docker engine: ' + engine.stdout.trim());
  const values = settings();
  if (!values.COMPOSE_PROJECT_NAME) { console.error('Run npm run dev once from this project folder.'); process.exitCode = 1; return; }
  spawnSync('docker', ['compose', 'ps'], { cwd: root, stdio: 'inherit', windowsHide: true });
  for (const service of ['catalog', 'orders', 'payment']) await check(`http://127.0.0.1:${values.QUICKCART_PORT}/api/${service}/health`, true);
  const file = resolve(root, '.quickcart-runtime.json');
  if (!existsSync(file)) {
    console.log('Vite is not running for this folder. Run npm run dev and leave its terminal open. Ctrl+C stops Vite.');
    process.exitCode = 1;
    return;
  }
  const runtime = JSON.parse(readFileSync(file, 'utf8'));
  await check(runtime.local);
  for (const service of ['catalog', 'orders', 'payment']) await check(new URL(`api/${service}/health`, runtime.local).href, true);
  console.log('\nUse the Local URL printed by Vite on this laptop. Keep Docker and the Vite terminal running.');
  console.log('For a new laptop, extract the clean ZIP and run npm install followed by npm run dev there.');
  console.log('This command verifies the current installation.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

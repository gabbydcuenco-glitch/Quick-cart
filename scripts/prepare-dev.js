const { spawnSync } = require('node:child_process');
const { initialize, settings } = require('./installation.js');
const { resolve } = require('node:path');
const { ensureImages } = require('./docker-images.js');
const root = resolve(__dirname, '..');
const compose = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.host.yml'];
async function healthy() {
  try {
    await Promise.all(['/api/catalog/health', '/api/orders/health', '/api/payment/health'].map(async path => {
      const response = await fetch(`http://127.0.0.1:${settings().QUICKCART_PORT}${path}`, { signal: AbortSignal.timeout(2500) });
      if (!response.ok || (await response.json()).status !== 'ok') throw new Error('API unavailable');
    }));
    return true;
  } catch { return false; }
}
async function prepare({ rebuild = false, dev = false } = {}) {
  process.chdir(root);
  const run = (args, visible = false) => spawnSync('docker', args, { cwd: root, stdio: visible ? 'inherit' : 'pipe', encoding: 'utf8', windowsHide: true });
  if (run(['info', '--format', '{{.ServerVersion}}']).status !== 0) {
    throw new Error('Open Docker Desktop, wait for the engine, then retry.');
  }
  const values = await initialize();
  Object.assign(process.env, values);
  const files = dev ? [...compose, '-f', 'docker-compose.dev.yml'] : compose;
  const built = ensureImages(files, { cwd: root, rebuild });
  if (!built) console.log('Checking Docker services...');
  // Still reconcile configuration and restart stopped services; routine progress
  // is hidden on cached starts, but every failure retains its Docker diagnostics.
  const started = run([...files, 'up', '-d', '--no-build', '--pull', 'never', '--wait', '--wait-timeout', '600'], built);
  if (started.status !== 0) {
    if (!built) console.error(started.stderr || started.stdout || started.error?.message || 'Docker startup failed.');
    throw new Error('Docker services did not become ready. Run npm run logs to see the failing service, then retry npm run dev.');
  }
  let ready = false;
  for (let attempt = 0; attempt < 15; attempt++) {
    if (await healthy()) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  if (!ready) throw new Error('Backend started but API health checks failed. Run npm run logs.');
  console.log('QuickCart Docker services ready: http://localhost:' + values.QUICKCART_PORT);
}
module.exports = { prepare, healthy };
if (require.main === module) prepare({ rebuild: process.argv.includes('--build'), dev: process.argv.includes('--dev') }).catch(error => {
  console.error(error.message); process.exitCode = 1;
});

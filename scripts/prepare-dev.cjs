const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const root = resolve(__dirname, '..');
const compose = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.host.yml'];
async function healthy() {
  try {
    await Promise.all(['/api/catalog/health', '/api/orders/health', '/api/payment/health'].map(async path => {
      const response = await fetch(`http://127.0.0.1:8082${path}`, { signal: AbortSignal.timeout(2500) });
      if (!response.ok || (await response.json()).status !== 'ok') throw new Error('API unavailable');
    }));
    return true;
  } catch { return false; }
}
async function prepare({ rebuild = false } = {}) {
  process.chdir(root);
  if (!rebuild && await healthy()) {
    console.log('QuickCart backend is already ready (8082).');
    return;
  }
  const run = args => spawnSync('docker', args, { cwd: root, stdio: 'inherit' });
  if (run(['info', '--format', '{{.ServerVersion}}']).status !== 0) {
    throw new Error('Open Docker Desktop, wait for the engine, then retry.');
  }
  require('./init-env.cjs');
  const values = require('node:util').parseEnv(readFileSync(resolve(root, '.env'), 'utf8'));
  for (const key of ['DB_USER', 'DB_PASSWORD']) process.env[key] = values[key];
  const flags = rebuild ? ['--build'] : ['--no-build', '--pull', 'never'];
  if (run([...compose, 'up', '-d', ...flags, '--wait', '--wait-timeout', '240']).status !== 0) {
    throw new Error(rebuild ? 'Backend build/start failed; review the Docker output.' : 'Could not start existing images. For first setup or backend changes run: npm run setup:dev');
  }
  if (!await healthy()) throw new Error('Backend started but API health checks failed. Run npm run logs.');
  console.log('QuickCart backend ready (8082).');
}
module.exports = { prepare, healthy };
if (require.main === module) prepare({ rebuild: process.argv.includes('--build') }).catch(error => {
  console.error(error.message); process.exitCode = 1;
});

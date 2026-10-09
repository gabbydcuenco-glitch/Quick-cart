const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
process.chdir(resolve(__dirname, '..'));
const compose = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.host.yml'];
function run(args, options = {}) {
  return spawnSync('docker', args, { encoding: 'utf8', stdio: 'inherit', ...options });
}
function fail(message) { console.error(message); process.exit(1); }
if (run(['info', '--format', '{{.ServerVersion}}'], { timeout: 20000 }).status !== 0) {
  fail('Docker is not accessible. Open Docker Desktop, wait for the engine, then retry npm run dev in your normal PowerShell.');
}
require('./init-env.cjs');
const values = require('node:util').parseEnv(readFileSync('.env', 'utf8'));
for (const key of ['DB_USER', 'DB_PASSWORD']) process.env[key] = values[key];
if (run([...compose, 'up', '-d', '--build', '--wait', '--wait-timeout', '240']).status !== 0) {
  run([...compose, 'logs', '--no-color', '--tail', '60', 'db', 'catalog-api', 'order-api']);
  fail('PostgreSQL/backend startup failed. The logs above show the cause. Data was not deleted.');
}
async function main() {
  for (const path of ['/api/catalog/health', '/api/orders/health', '/api/payment/health', '/api/catalog/products']) {
    const response = await fetch(`http://127.0.0.1:8082${path}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
    const body = await response.json();
    if (path.endsWith('/products') && (!Array.isArray(body) || body.length === 0)) throw new Error('No products found in PostgreSQL.');
  }
  console.log('PostgreSQL and APIs verified at http://127.0.0.1:8082. Ready for Vite on http://localhost:8080.');
}
main().catch(error => fail(error.message));

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { parseEnv } = require('node:util');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function settings() {
  const file = path.join(root, '.env');
  return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')) : {};
}
function freePort(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
  });
}
async function initialize() {
  const run = (args, input) => spawnSync('docker', args, { input, encoding: 'utf8', timeout: 15000, windowsHide: true });
  if (run(['info', '--format', '{{.ServerVersion}}']).status !== 0) throw new Error('Open Docker Desktop and wait for the engine, then retry.');
  const values = settings();
  // A package with no installation ID must never adopt another project's database.
  if (!values.COMPOSE_PROJECT_NAME) {
    values.COMPOSE_PROJECT_NAME = 'quickcart-' + randomBytes(6).toString('hex');
    values.DB_USER = 'quickcart';
    delete values.DB_PASSWORD;
    values.TAG = values.COMPOSE_PROJECT_NAME;
    delete values.QUICKCART_PORT;
  }
  if (!/^quickcart-[a-z0-9-]+$/.test(values.COMPOSE_PROJECT_NAME)) throw new Error('Invalid installation ID in .env.');
  values.TAG ||= values.COMPOSE_PROJECT_NAME;
  const databases = run(['ps', '-aq', '--filter', 'label=com.docker.compose.project=' + values.COMPOSE_PROJECT_NAME, '--filter', 'label=com.docker.compose.service=db']);
  if (databases.status !== 0) throw new Error('Cannot inspect the QuickCart database.');
  if (!databases.stdout.trim()) {
    const volume = run(['volume', 'ls', '--format', '{{.Name}}', '--filter', 'label=com.docker.compose.project=' + values.COMPOSE_PROJECT_NAME]);
    if (volume.status !== 0) throw new Error('Cannot inspect QuickCart database storage.');
    if (volume.stdout.trim().split(/\s+/).includes(values.COMPOSE_PROJECT_NAME + '_pg-data')) {
      values.DB_USER ||= 'quickcart';
      delete values.DB_PASSWORD;
      require('./docker-images.js').ensureImages(['compose'], { cwd: root, env: { ...process.env, ...values }, services: ['db'] });
      const restored = spawnSync('docker', ['compose', 'up', '-d', '--no-build', '--pull', 'never', 'db'], {
        cwd: root, env: { ...process.env, ...values }, stdio: 'inherit', windowsHide: true,
      });
      if (restored.status !== 0) throw new Error('Could not reconnect QuickCart database storage. Check Docker logs.');
    }
  }
  const credentials = require('./database-env.js').resolveCredentials(values, run, values.COMPOSE_PROJECT_NAME);
  values.DB_USER = credentials.user;
  delete values.DB_PASSWORD;
  const owned = run(['ps', '-q', '--filter', 'label=com.docker.compose.project=' + values.COMPOSE_PROJECT_NAME, '--filter', 'label=com.docker.compose.service=proxy']);
  if (owned.status !== 0) throw new Error('Cannot inspect this installation.');
  if (!owned.stdout.trim()) {
    let port = Number(values.QUICKCART_PORT) || 8082;
    while (port < 65535 && !await freePort(port)) port++;
    if (port >= 65535) throw new Error('No free local port found.');
    values.QUICKCART_PORT = String(port);
  }
  if (!/^\d+$/.test(values.QUICKCART_PORT || '')) throw new Error('Missing installation port. Stop this installation and run setup again.');
  const keys = ['COMPOSE_PROJECT_NAME', 'QUICKCART_PORT', 'TAG', 'DB_USER'];
  for (const key of keys) if (!values[key] || /['\r\n]/.test(values[key])) throw new Error('Invalid setting: ' + key);
  fs.writeFileSync(path.join(root, '.env'), keys.map(k => k + "='" + values[k] + "'").join('\n') + '\n', { mode: 0o600 });
  return values;
}
module.exports = { initialize, settings };



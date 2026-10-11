const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const root = resolve(__dirname, '..');
const unavailable = { ...process.env, DOCKER_HOST: process.platform === 'win32'
  ? 'npipe:////./pipe/quickcart-test-unavailable' : 'unix:///tmp/quickcart-test-unavailable.sock' };
delete unavailable.DOCKER_CONTEXT;
delete unavailable.VITE_CONTAINER_DEV;

test('startup rejects unavailable Docker even with a live backend on port 8082', () => {
  const result = spawnSync(process.execPath, ['scripts/prepare-dev.js'], {
    cwd: root, env: unavailable, encoding: 'utf8', timeout: 20000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Open Docker Desktop/);
});
test('direct frontend Vite launch also refuses unavailable Docker', () => {
  const result = spawnSync(process.execPath, ['frontend/node_modules/vite/bin/vite.js', '--config', 'frontend/vite.config.js'], {
    cwd: root, env: unavailable, encoding: 'utf8', timeout: 20000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Open Docker Desktop/);
  assert.doesNotMatch(result.stdout, /Local:\s+http/);
});
test('store requires all backend health checks and recovers on reconnection', async () => {
  const { servicesAvailable } = await import(pathToFileURL(resolve(root, 'frontend/src/service-health.js')));
  const ok = async () => ({ ok: true, json: async () => ({ status: 'ok' }) });
  assert.equal(await servicesAvailable(ok), true);
  assert.equal(await servicesAvailable(async path => path.includes('orders')
    ? { ok: false } : ok()), false);
  assert.equal(await servicesAvailable(async () => { throw new Error('Connection refused'); }), false);
  assert.equal(await servicesAvailable(async () => ({ ok: true, json: async () => ({ status: 'error' }) })), false);
  assert.equal(await servicesAvailable(ok), true);
});

test('watchdog detects loss after successful startup without using the real daemon', async () => {
  const { watchDocker } = await import(pathToFileURL(resolve(root, 'frontend/docker-ready.js')));
  let calls = 0;
  let callbacks = 0;
  await new Promise((done, reject) => {
    const timeout = setTimeout(() => { stop(); reject(new Error('Watchdog did not stop')); }, 1000);
    const stop = watchDocker(() => { callbacks++; clearTimeout(timeout); done(); }, {
      intervalMs: 5, check: async () => ++calls < 3,
    });
  });
  assert.equal(calls, 5);
  assert.equal(callbacks, 1);
});

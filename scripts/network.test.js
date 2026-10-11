const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer: createHttpServer } = require('node:http');
const { mkdtempSync, readFileSync, existsSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { resolve } = require('node:path');
const { pathToFileURL } = require('node:url');
const { once } = require('node:events');
const root = resolve(__dirname, '..');

test('Windows loopback-only listeners also force a new Vite port', async () => {
  const { availableDevPort } = await import(pathToFileURL(resolve(root, 'frontend/dev-network.js')));
  for (const host of ['127.0.0.1', '::1']) {
    const blocker = createHttpServer((req, res) => res.end('occupied'));
    blocker.listen({ host, port: 0, ipv6Only: host === '::1' });
    await once(blocker, 'listening');
    try { assert.ok(await availableDevPort(blocker.address().port) > blocker.address().port); }
    finally { blocker.closeAllConnections(); await new Promise(done => blocker.close(done)); }
  }
});

test('Vite serves only this laptop, prints only Local, and falls back from an occupied port', async () => {
  const { createServer } = await import(pathToFileURL(resolve(root, 'frontend/node_modules/vite/dist/node/index.js')));
  const configFactory = (await import(pathToFileURL(resolve(root, 'frontend/vite.config.js')))).default;
  const { recordDevAddress } = await import(pathToFileURL(resolve(root, 'frontend/dev-network.js')));
  const config = await configFactory({ command: 'build', mode: 'test' });
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 8080);
  assert.equal(config.server.strictPort, false);
  const blocker = createHttpServer((req, res) => res.end('occupied'));
  blocker.listen(0);
  await once(blocker, 'listening');
  const busyPort = blocker.address().port;
  const temp = mkdtempSync(resolve(tmpdir(), 'quickcart-network-'));
  const runtimeFile = resolve(temp, 'runtime.json');
  let server;
  try {
    server = await createServer({
      configFile: false, root: resolve(root, 'frontend'), logLevel: 'silent',
      cacheDir: resolve(temp, 'vite-cache'),
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { ...config.server, port: busyPort, watch: null },
      plugins: [{ name: 'test-address', configureServer: s => { recordDevAddress(s, runtimeFile); } }],
    });
    await server.listen();
    const port = server.httpServer.address().port;
    assert.ok(port > busyPort, 'must select another port');
    const runtime = JSON.parse(readFileSync(runtimeFile, 'utf8'));
    assert.equal(runtime.port, port);
    assert.equal(server.httpServer.address().address, '127.0.0.1');
    assert.deepEqual(server.resolvedUrls.network, []);
    assert.equal(runtime.network, undefined);
    const output = [];
    server.config.logger.info = message => output.push(message);
    server.printUrls();
    assert.match(output.join('\n'), /Local:.*localhost/);
    assert.doesNotMatch(output.join('\n'), /Network/);
    const response = await fetch(runtime.local, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200);
    assert.match(await response.text(), /src\/main.jsx/);
    const displayed = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(10000) });
    assert.equal(displayed.status, 200, 'the displayed localhost URL must work');
  } finally {
    await server?.close();
    await new Promise(done => blocker.close(done));
    assert.equal(existsSync(runtimeFile), false);
    // temp is created by mkdtemp above and contains only this test's files.
    assert.ok(temp.startsWith(resolve(tmpdir(), 'quickcart-network-')));
    rmSync(temp, { recursive: true, force: true });
  }
});

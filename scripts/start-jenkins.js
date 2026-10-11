const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

async function main() {
  const start = Date.now();
  const run = (args, visible = false) => spawnSync('docker', args, {
    cwd: resolve(__dirname, '..'), encoding: 'utf8', windowsHide: true,
    stdio: visible ? 'inherit' : 'pipe',
  });
  if (run(['info', '--format', '{{.ServerVersion}}']).status !== 0) {
    throw new Error('Open Docker Desktop and wait for its engine, then run npm run jenkins again.');
  }
  const compose = ['compose', '-p', 'quickcart-jenkins', '-f', 'infra/jenkins/docker-compose.yml'];
  const config = run([...compose, 'config', '--images']);
  if (config.status !== 0) throw new Error(config.stderr || 'Cannot read Jenkins configuration.');
  const images = config.stdout.trim().split(/\s+/).filter(Boolean);
  if (!images.length) throw new Error('No Jenkins image configured.');
  const missing = images.some(image => run(['image', 'inspect', image]).status !== 0);
  if (missing || process.argv.includes('--build')) {
    const built = run([...compose, 'build'], true);
    if (built.status !== 0) throw new Error('Jenkins build failed. See the Docker error above.');
  }
  const result = run([...compose, 'up', '-d', '--no-build', '--pull', 'never']);
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Jenkins startup failed.');
  const mapping = run(['port', 'jenkins', '8080/tcp']);
  const port = mapping.stdout?.trim().split(/\r?\n/)[0]?.match(/:(\d+)$/)?.[1];
  if (mapping.status !== 0 || !port) throw new Error('Could not find the Jenkins published port.');
  const url = `http://localhost:${port}/`;
  console.log('Waiting for Jenkins to be ready...');
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/login`, { signal: AbortSignal.timeout(4000) });
      if (response.ok && response.headers.get('x-jenkins')) {
        const version = response.headers.get('x-jenkins').replace(/[^0-9A-Za-z._-]/g, '');
        if (process.stdout.isTTY) process.stdout.write('\x1b[2J\x1b[H');
        console.log(`\n  \x1b[32mJENKINS v${version}\x1b[0m  \x1b[90mready in\x1b[0m ${Date.now() - start} ms\n`);
        console.log(`  \x1b[32m➜\x1b[0m  Local:   \x1b[36;1m${url}\x1b[0m`);
        console.log('\n  Starting QuickCart...\n');
        return;
      }
    } catch { /* Jenkins may still be loading its plugins. */ }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Jenkins is not ready after 5 minutes. Check: docker logs jenkins');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });

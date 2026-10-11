const { spawnSync } = require('node:child_process');

// Inspect local images before starting Compose. Cached starts never contact a registry.
function ensureImages(files, { cwd, env = process.env, rebuild = false, services, run = spawnSync } = {}) {
  const config = run('docker', [...files, 'config', '--format', 'json'], {
    cwd, env, encoding: 'utf8', windowsHide: true, timeout: 30000,
  });
  if (config.status !== 0) throw new Error('Cannot read Docker configuration: ' + (config.stderr || config.error?.message || 'Compose failed.'));
  const entries = Object.entries(JSON.parse(config.stdout).services)
    .filter(([name]) => !services || services.includes(name));
  const missing = entries.filter(([, service]) => rebuild || run('docker', ['image', 'inspect', service.image], {
    cwd, env, stdio: 'ignore', windowsHide: true, timeout: 15000,
  }).status !== 0).map(([name]) => name);
  if (!missing.length) {
    console.log('Reusing installed Docker images (no build or download).');
    return false;
  }
  console.log((rebuild ? 'Rebuilding' : 'Preparing missing') + ' Docker images: ' + missing.join(', '));
  const built = run('docker', [...files, 'build', ...missing], { cwd, env, stdio: 'inherit', windowsHide: true });
  if (built.status !== 0) throw new Error('Docker image setup failed. First setup needs Internet; check the build output, then retry npm run dev.');
  return true;
}

module.exports = { ensureImages };

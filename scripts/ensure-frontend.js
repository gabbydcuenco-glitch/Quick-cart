const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const frontend = resolve(root, 'frontend');
const manifest = JSON.parse(readFileSync(resolve(frontend, 'package.json'), 'utf8'));
const dependencies = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
const viteBin = resolve(frontend, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const installed = existsSync(viteBin) && dependencies.every(name =>
  existsSync(resolve(frontend, 'node_modules', name, 'package.json'))
);

if (!installed) {
  console.log('Installing missing QuickCart frontend dependencies...');
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !existsSync(npmCli)) {
    console.error('Run npm install or npm run dev from the QuickCart project folder.');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [npmCli, '--prefix', frontend, 'ci', '--include=dev'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}

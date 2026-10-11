const { spawnSync } = require('node:child_process');
const docker = (args, input) => spawnSync('docker', args, {
  input, encoding: 'utf8', timeout: 20000, windowsHide: true,
});

// Passwordless local demo database, reachable only on the private Docker network.
// Only containers belonging to this installation may be inspected or updated.
function resolveCredentials(values, run = docker, project = 'quickcart') {
  if (run(['info', '--format', '{{.ServerVersion}}']).status !== 0)
    throw new Error('Open Docker Desktop and wait for the engine before starting QuickCart.');
  const listed = run(['ps', '-aq', '--filter', 'label=com.docker.compose.project=' + project,
    '--filter', 'label=com.docker.compose.service=db']);
  if (listed.status !== 0) throw new Error('Unable to inspect the QuickCart database.');
  const ids = listed.stdout.trim().split(/\s+/).filter(Boolean);
  if (ids.length > 1) throw new Error('Multiple databases found for this QuickCart installation.');
  if (!ids.length) return { user: values.DB_USER || 'quickcart' };
  const inspected = run(['inspect', ids[0]]);
  if (inspected.status !== 0) throw new Error('Unable to inspect the QuickCart database container.');
  const container = JSON.parse(inspected.stdout)[0];
  const env = Object.fromEntries(container.Config.Env.map(value => {
    const index = value.indexOf('=');
    return [value.slice(0, index), value.slice(index + 1)];
  }));
  const user = env.POSTGRES_USER || values.DB_USER || 'quickcart';
  if (!container.State.Running && run(['start', ids[0]]).status !== 0)
    throw new Error('Could not start the QuickCart database. Check Docker logs.');
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (run(['exec', ids[0], 'pg_isready', '-h', '127.0.0.1', '-U', user, '-d', 'quickcart']).status === 0) { ready = true; break; }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  if (!ready) throw new Error('QuickCart database did not become ready. Check Docker logs.');
  // Migrate older password-based installations without deleting their data.
  const result = run(['exec', '-i', '-u', 'postgres', ids[0], 'sh', '-c',
    'cat > "$PGDATA/pg_hba.conf" && pg_ctl reload -D "$PGDATA"'],
    'local all all trust\nhost all all all trust\n');
  if (result.status !== 0) throw new Error('Could not configure the Docker database. Existing data is preserved.');
  const identifier = '"' + user.replace(/"/g, '""') + '"';
  const cleared = run(['exec', '-i', ids[0], 'psql', '-U', user, '-d', 'quickcart', '-v', 'ON_ERROR_STOP=1'],
    `ALTER ROLE ${identifier} PASSWORD NULL;\n`);
  if (cleared.status !== 0) throw new Error('Could not update the Docker database role. Existing data is preserved.');
  // Confirm passwordless TCP access after the configuration reload.
  for (let attempt = 0; attempt < 10; attempt++) {
    const checked = run(['exec', ids[0], 'psql', '-w', '-h', '127.0.0.1', '-U', user, '-d', 'quickcart', '-Atqc', 'SELECT 1']);
    if (checked.status === 0 && checked.stdout.trim() === '1') return { user };
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  throw new Error('Docker database is not ready for connections. Check Docker logs.');
}
module.exports = { resolveCredentials };

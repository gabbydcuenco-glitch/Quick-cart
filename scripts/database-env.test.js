const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveCredentials } = require('./database-env.js');
function fake({ running = true, exists = true, engine = true, failRepair = false } = {}) {
  const calls = [];
  const run = (args, input) => {
    calls.push({ args, input });
    if (args[0] === 'info') return { status: engine ? 0 : 1, stdout: '29' };
    if (args[0] === 'ps') return { status: 0, stdout: exists ? 'db-id\n' : '' };
    if (args[0] === 'inspect') return { status: 0, stdout: JSON.stringify([{ State: { Running: running }, Config: { Env: ['POSTGRES_USER=quickcart', 'POSTGRES_PASSWORD=old-password'] } }]) };
    if (args[0] === 'start') return { status: 0, stdout: 'db-id' };
    if (args.includes('pg_isready')) return { status: 0, stdout: 'ready' };
    if (args.includes('sh')) return { status: failRepair ? 1 : 0, stdout: 'reloaded' };
    if (args.includes('psql')) return { status: 0, stdout: args.includes('SELECT 1') ? '1\n' : 'ALTER ROLE' };
    throw new Error('Unexpected command');
  };
  return { run, calls };
}
test('fresh laptop needs no password', () => {
  assert.deepEqual(resolveCredentials({}, fake({ exists: false }).run), { user: 'quickcart' });
});
test('old saved or incorrect passwords are ignored and removed from the role', () => {
  const { run, calls } = fake();
  assert.deepEqual(resolveCredentials({ DB_PASSWORD: 'wrong' }, run), { user: 'quickcart' });
  assert.ok(calls.some(c => c.input === 'ALTER ROLE "quickcart" PASSWORD NULL;\n'));
  assert.ok(calls.every(c => !c.args.includes('wrong') && !c.args.includes('rm') && !c.args.includes('down')));
});
test('stopped database is restarted without deleting its volume', () => {
  const { run, calls } = fake({ running: false });
  assert.deepEqual(resolveCredentials({}, run), { user: 'quickcart' });
  assert.ok(calls.some(c => c.args[0] === 'start'));
});
test('Docker is required', () => {
  assert.throws(() => resolveCredentials({}, fake({ engine: false }).run), /Open Docker Desktop/);
});
test('database configuration failures are reported without a password prompt', () => {
  assert.throws(() => resolveCredentials({}, fake({ failRepair: true }).run), /Could not configure/);
});
test('another installations database is never inspected or altered', () => {
  const { run, calls } = fake({ exists: false });
  assert.deepEqual(resolveCredentials({}, run, 'quickcart-fresh'), { user: 'quickcart' });
  assert.ok(calls.find(c => c.args[0] === 'ps').args.includes('label=com.docker.compose.project=quickcart-fresh'));
  assert.ok(calls.every(c => c.args[0] !== 'exec' && c.args[0] !== 'inspect'));
});

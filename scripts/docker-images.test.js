const test = require('node:test');
const assert = require('node:assert/strict');
const { ensureImages } = require('./docker-images.js');

function docker(cached = [], failBuild = false) {
  const calls = [];
  const run = (bin, args) => {
    assert.equal(bin, 'docker');
    calls.push(args);
    if (args.includes('config')) return { status: 0, stdout: JSON.stringify({ services: {
      db: { image: 'quickcart/db:demo' }, frontend: { image: 'quickcart/frontend:demo' },
    } }) };
    if (args[0] === 'image') return { status: cached.includes(args[2]) ? 0 : 1 };
    if (args.includes('build')) return { status: failBuild ? 1 : 0 };
    throw new Error('Unexpected Docker operation: ' + args);
  };
  return { calls, run };
}
test('fresh installation automatically builds missing images', () => {
  const fake = docker();
  ensureImages(['compose'], { run: fake.run });
  assert.deepEqual(fake.calls.find(c => c.includes('build')), ['compose', 'build', 'db', 'frontend']);
});
test('cached startup neither builds nor pulls images', () => {
  const fake = docker(['quickcart/db:demo', 'quickcart/frontend:demo']);
  ensureImages(['compose'], { run: fake.run });
  assert.ok(fake.calls.every(c => !c.includes('build') && !c.includes('pull')));
});
test('only a deleted image is rebuilt', () => {
  const fake = docker(['quickcart/db:demo']);
  ensureImages(['compose'], { run: fake.run });
  assert.deepEqual(fake.calls.find(c => c.includes('build')), ['compose', 'build', 'frontend']);
});
test('explicit rebuild refreshes existing images', () => {
  const fake = docker(['quickcart/db:demo', 'quickcart/frontend:demo']);
  ensureImages(['compose'], { run: fake.run, rebuild: true });
  assert.deepEqual(fake.calls.find(c => c.includes('build')), ['compose', 'build', 'db', 'frontend']);
});
test('volume restoration only prepares the database image', () => {
  const fake = docker();
  ensureImages(['compose'], { run: fake.run, services: ['db'] });
  assert.deepEqual(fake.calls.find(c => c.includes('build')), ['compose', 'build', 'db']);
});
test('failed build does not continue as a successful setup', () => {
  assert.throws(() => ensureImages(['compose'], { run: docker([], true).run }), /setup failed/);
});

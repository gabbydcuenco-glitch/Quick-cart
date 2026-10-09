const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { parseEnv } = require('node:util');
const { resolve } = require('node:path');
process.chdir(resolve(__dirname, '..'));
const text = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8').replace(/^\uFEFF/, '') : '';
const values = parseEnv(text);
const user = values.DB_USER || 'quickcart';
const password = values.DB_PASSWORD || randomBytes(24).toString('hex');
if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(user) || /['\r\n]/.test(password)) {
  throw new Error('Invalid database user or credential quoting in .env');
}
const extra = text.split(/\r?\n/).filter(line => !/^\s*(DB_USER|DB_PASSWORD|DB_ROOT_PASSWORD)\s*=/.test(line));
fs.writeFileSync('.env', [...extra, `DB_USER='${user}'`, `DB_PASSWORD='${password}'`].join('\n') + '\n', { mode: 0o600 });
console.log('PostgreSQL credentials ready; existing nonempty password preserved.');

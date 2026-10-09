const { Pool } = require('pg');
if (!process.env.DB_PASSWORD) throw new Error('DB_PASSWORD is required');
module.exports = new Pool({
  host: process.env.DB_HOST || 'db', port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'quickcart', max: 10,
});

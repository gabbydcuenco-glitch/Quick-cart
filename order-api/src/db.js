const { Pool } = require('pg');

module.exports = new Pool({
  host: process.env.DB_HOST || 'db', port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'quickcart',
  database: process.env.DB_NAME || 'quickcart', max: 10,
});


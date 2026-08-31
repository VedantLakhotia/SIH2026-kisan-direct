const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'society_app',
  password: 'paradox',
  port: 5432,
});

module.exports = pool;
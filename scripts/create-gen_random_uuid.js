const { pool } = require('../src/lib/connectors/db');

async function run () {
  const { error } = await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  console.log(error || 'Created postgres extension pgcrypto');
  process.exit(error ? 1 : 0);
}

run();

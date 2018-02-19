require('dotenv').config();
const { Pool } = require('pg');

if (process.env.DATABASE_URL) {
  // get heroku db params from env vars
  var workingVariable = process.env.DATABASE_URL.replace('postgres://', '')
  process.env.PGUSER = workingVariable.split('@')[0].split(':')[0]
  process.env.PGPASSWORD = workingVariable.split('@')[0].split(':')[1]
  process.env.PGHOST = workingVariable.split('@')[1].split(':')[0]
  process.env.PSPORT = workingVariable.split('@')[1].split(':')[1].split('/')[0]
  process.env.PGDATABASE = workingVariable.split('@')[1].split(':')[1].split('/')[1]
}

const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function run() {
  const {error} = await pool.query('CREATE SCHEMA IF NOT EXISTS water;');
  console.log(error ? error : 'OK');
  process.exit(error ? 1 : 0);
}

run();

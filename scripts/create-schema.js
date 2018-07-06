require('dotenv').config();
const { Pool } = require('pg');
const { pg } = require('../config');

const pool = new Pool(pg);

async function run () {
  const {error} = await pool.query('CREATE SCHEMA IF NOT EXISTS water;');
  console.log(error || 'OK');
  process.exit(error ? 1 : 0);
}

run();

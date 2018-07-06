/**
 * Updates task config data in DB using config files
 */
require('dotenv').config();
const { Pool } = require('pg');
const { pg } = require('../config');

const pool = new Pool(pg);

const rows = require('../config/task-config');

const migrate = async () => {
  console.log(`Updating task configs`);
  try {
    for (let row of rows) {
      console.log(`Updating ${row.type} ${row.subtype}`);

      const sql = `INSERT INTO "water"."task_config"
      (task_config_id, type, subtype, config, created)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (task_config_id)
      DO UPDATE SET modified=NOW(), config=EXCLUDED.config
    `;

      const params = [row.task_config_id, row.type, row.subtype, JSON.stringify(row.config)];

      const { error } = await pool.query(sql, params);
      if (error) {
        throw error;
      }
    }

    console.log('Task configs updated successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();

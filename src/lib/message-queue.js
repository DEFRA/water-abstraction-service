/**
 * Create message queue
 * @see {@link https://github.com/timgit/pg-boss/blob/master/docs/usage.md#start}
 */
const PgBoss = require('pg-boss');

const options = {
  connectionString: process.env.DATABASE_URL,
  schema: 'water',
  application_name: process.env.servicename
};

const boss = new PgBoss(options);

module.exports = boss;

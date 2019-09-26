const db = require('../../../lib/connectors/db');
const { TEST_EXTERNAL_USER_EMAIL } = require('./constants');

const deleteAll = () => {
  return db.query(`
    delete from
    water.events
    where issuer = '${TEST_EXTERNAL_USER_EMAIL}';
  `);
};

exports.delete = deleteAll;

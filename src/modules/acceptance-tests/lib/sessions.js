const db = require('../../../lib/connectors/db');
const { TEST_COMPANY_NAME } = require('./constants');

const deleteAll = () => {
  return db.query(`
    delete
    from water.sessions
    where session_data::jsonb->>'companyName' = '${TEST_COMPANY_NAME}';
  `);
};

exports.delete = deleteAll;

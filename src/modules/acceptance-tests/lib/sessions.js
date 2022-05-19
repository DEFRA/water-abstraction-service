const { pool } = require('../../../lib/connectors/db')
const { TEST_COMPANY_NAME } = require('./constants')

const deleteAll = () => {
  return pool.query(`
    delete
    from water.sessions
    where session_data::jsonb->>'companyName' = '${TEST_COMPANY_NAME}';
  `)
}

exports.delete = deleteAll

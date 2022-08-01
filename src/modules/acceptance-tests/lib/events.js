'use strict'

const { pool } = require('../../../lib/connectors/db')

const deleteAll = () => {
  return pool.query(`
    delete from
    water.events
    where strpos(issuer, 'acceptance-test') = 1;
  `)
}

exports.delete = deleteAll

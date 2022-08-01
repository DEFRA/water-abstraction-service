'use strict'

const { pool } = require('../../../lib/connectors/db')

const deleteRegions = () => pool.query(`
    delete from
    water.regions
    where is_test = true;`
)

exports.delete = deleteRegions

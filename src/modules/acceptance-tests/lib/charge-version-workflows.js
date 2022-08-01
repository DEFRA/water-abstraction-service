'use strict'

const { bookshelf } = require('../../../lib/connectors/bookshelf')
const { ACCEPTANCE_TEST_SOURCE } = require('./constants')

const deleteChargeVersionWorkflowQuery = `
    delete from
    water.charge_version_workflows
    where data->>'source'='${ACCEPTANCE_TEST_SOURCE}';
    `

const deleteChargeVersionWorkflows = async () => bookshelf.knex.raw(deleteChargeVersionWorkflowQuery)

exports.delete = deleteChargeVersionWorkflows

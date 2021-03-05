'use strict';

const { pool } = require('../../../lib/connectors/db');

const deleteChargeVersionWorkflows = () => {
  return pool.query(`
    delete from
    water.charge_version_workflows
    where data->>'isTest'='true';
    `);
};

exports.delete = deleteChargeVersionWorkflows;

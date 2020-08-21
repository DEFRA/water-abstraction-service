'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeVersionWorkflow', {
  tableName: 'charge_version_workflows',

  idAttribute: 'charge_version_workflow_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false

});

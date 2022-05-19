'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ChargeVersionWorkflow', {
  tableName: 'water.charge_version_workflows',

  idAttribute: 'charge_version_workflow_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false,

  licence () {
    return this.hasOne('Licence', 'licence_id', 'licence_id')
  },

  licenceVersion () {
    return this.hasOne('LicenceVersion', 'licence_version_id', 'licence_version_id')
  }
})

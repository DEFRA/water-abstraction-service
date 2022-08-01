'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('Licence', {
  tableName: 'water.licences',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false,

  idAttribute: 'licence_id',

  region () {
    return this.hasOne('Region', 'region_id', 'region_id')
  },

  licenceAgreements () {
    return this.hasMany('LicenceAgreement', 'licence_ref', 'licence_ref')
  },

  licenceVersions () {
    return this.hasMany('LicenceVersion', 'licence_id', 'licence_id')
  }
})

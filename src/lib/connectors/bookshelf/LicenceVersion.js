'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('LicenceVersion', {
  tableName: 'water.licence_versions',

  idAttribute: 'licence_version_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licence () {
    return this.belongsTo('Licence', 'licence_id', 'licence_id')
  },

  licenceVersionPurposes () {
    return this.hasMany('LicenceVersionPurpose', 'licence_version_id', 'licence_version_id')
  }
})

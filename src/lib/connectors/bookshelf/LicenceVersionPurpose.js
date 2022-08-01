'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('LicenceVersionPurpose', {
  tableName: 'water.licence_version_purposes',

  idAttribute: 'licence_version_purpose_id',

  hasTimestamps: ['date_created', 'date_updated'],

  licenceVersion () {
    return this.belongsTo('LicenceVersion', 'licence_version_id', 'licence_version_id')
  },

  purposePrimary () {
    return this.hasOne('PurposePrimary', 'purpose_primary_id', 'purpose_primary_id')
  },

  purposeSecondary () {
    return this.hasOne('PurposeSecondary', 'purpose_secondary_id', 'purpose_secondary_id')
  },

  purposeUse () {
    return this.hasOne('PurposeUse', 'purpose_use_id', 'purpose_use_id')
  }
})

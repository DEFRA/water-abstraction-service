'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ReturnRequirementPurpose', {

  tableName: 'water.return_requirement_purposes',

  idAttribute: 'return_requirement_purpose_id',

  hasTimestamps: ['date_created', 'date_updated'],

  purposeUse () {
    return this.hasOne('PurposeUse', 'purpose_use_id', 'purpose_use_id')
  }
})

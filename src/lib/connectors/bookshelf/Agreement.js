'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('Agreement', {
  tableName: 'water.financial_agreement_types',

  idAttribute: 'id',

  hasTimestamps: ['date_created', 'date_updated'],

  licenceAgreement () {
    return this.belongsTo('LicenceAgreement', 'id', 'financial_agreement_type_id')
  }
})

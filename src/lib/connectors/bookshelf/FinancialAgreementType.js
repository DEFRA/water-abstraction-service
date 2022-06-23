'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('FinancialAgreementType', {
  tableName: 'water.financial_agreement_types',

  idAttribute: 'financial_agreement_type_id',

  hasTimestamps: ['date_created', 'date_updated']

})

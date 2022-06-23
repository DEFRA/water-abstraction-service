'use strict'
const { FinancialAgreementType } = require('../bookshelf')
const helpers = require('./lib/helpers')

const findOneByFinancialAgreementCode = code =>
  helpers.findOne(FinancialAgreementType, 'financialAgreementCode', code)

exports.findOneByFinancialAgreementCode = findOneByFinancialAgreementCode

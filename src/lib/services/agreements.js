'use strict'
const service = require('./service')
const financialAgreementTypesRepo = require('../../lib/connectors/repos/financial-agreement-types')
const agreementMapper = require('../mappers/agreement')

/**
 * Gets a single financial agreement type by financial agreement code
 * @param {String} code
 * @return {Promise<Agreement>}
 */
const getAgreementByCode = code =>
  service.findOne(code, financialAgreementTypesRepo.findOneByFinancialAgreementCode, agreementMapper)

exports.getAgreementByCode = getAgreementByCode

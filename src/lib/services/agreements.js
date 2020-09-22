'use strict';
const service = require('./service');
const financialAgreementTypeRepo = require('../../lib/connectors/repos/financial-agreement-type');
const agreementMapper = require('../mappers/agreement');

/**
 * Gets a single financial agreement type by financial agreement code
 * @param {String} code
 * @return {Promise<Agreement>}
 */
const getAgreementByCode = code =>
  service.findOne(code, financialAgreementTypeRepo.findOneByFinancialAgreementCode, agreementMapper);

exports.getAgreementByCode = getAgreementByCode;

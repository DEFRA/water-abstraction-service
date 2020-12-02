const { FinancialAgreementType, bookshelf } = require('../../../src/lib/connectors/bookshelf');

const agreementDescriptions = {
  S127: 'Section 127 (Two Part Tariff)'
};

const createAgreementIfDoesNotExist = `insert into water.financial_agreement_types
  (financial_agreement_code, description, disabled, date_created, date_updated, is_test) values
  (:agreementCode, :description, false, NOW(), NOW(), true) 
  on conflict (financial_agreement_code) do nothing returning *;`;

/**
 * Create the test licence agreement for the licence specified
 * @param {Object} licence
 * @param {String} scenarioKey
 */
const create = async agreementCode =>
  bookshelf.knex.raw(createAgreementIfDoesNotExist, {
    agreementCode,
    description: agreementDescriptions[agreementCode]
  });

const findOneByFinancialAgreementCode = async code => {
  const result = await FinancialAgreementType
    .forge({ financialAgreementCode: code })
    .fetch();
  return result.toJSON();
};

const tearDown = () =>
  bookshelf.knex('water.financial_agreement_types')
    .where('is_test', true)
    .del();

exports.findOneByFinancialAgreementCode = findOneByFinancialAgreementCode;
exports.create = create;
exports.tearDown = tearDown;

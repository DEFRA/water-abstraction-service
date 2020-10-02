const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const agreementDescriptions = {
  S127: 'Section 127 (Two Part Tariff)'
};

const createAgreementIfDoesNotExist = `insert into water.financial_agreement_types
  (id, description, disabled, date_created, date_updated, is_test)
values
  (:agreementId, :description, false, NOW(), NOW(), true) on conflict (id) do nothing returning *;`;

/**
 * Create the test licence agreement for the licence specified
 * @param {Object} licence
 * @param {String} scenarioKey
 */
const create = agreementId =>
  bookshelf.knex.raw(createAgreementIfDoesNotExist, {
    agreementId,
    description: agreementDescriptions[agreementId]
  });

const tearDown = () =>
  bookshelf.knex('water.financial_agreement_types')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;

const data = require('./data');
const agreements = require('./agreements');
const { LicenceAgreement, bookshelf } = require('../../../src/lib/connectors/bookshelf');

const cache = {};

/**
 * Create the test licence agreement for the licence specified
 * @param {Object} licence
 * @param {String} scenarioKey
 */
const create = async (licence, scenarioKey) => {
  if (!cache[scenarioKey]) {
    const licenceAgreementData = data.licenceAgreements[scenarioKey];
    await agreements.create(licenceAgreementData.financialAgreementTypeId);

    const licenceAgreement = await LicenceAgreement
      .forge({
        isTest: true,
        licenceRef: licence.get('licenceRef'),
        ...licenceAgreementData
      })
      .save();

    cache[scenarioKey] = licenceAgreement;
  }
  return cache[scenarioKey];
};

const tearDown = () =>
  bookshelf.knex('water.licence_agreements')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;

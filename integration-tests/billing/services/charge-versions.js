const data = require('./data');
const { ChargeVersion, bookshelf } = require('../../../src/lib/connectors/bookshelf');

/**
 * Creates a charge version using the supplied scenario key,
 * for the supplied region, licence, and CRM company/invoice account
 * @param {Object} region - bookshelf model for region
 * @param {Object} licence - bookshelf model for licence
 * @param {String} scenarioKey - the scenario for the charge version to create
 * @param {Object} crmData
 * @param {Object} crmData.company - the CRM company entity for the licence holder
 * @param {Object} crmData.invoiceAccount - the CRM invoice account who receives the bill
 * @return {Promise}
 */
const create = async (region, licence, scenarioKey, crmData) => ChargeVersion
  .forge({
    isTest: true,
    regionCode: region.get('naldRegionId'),
    licenceRef: licence.get('licenceRef'),
    ...data.chargeVersions[scenarioKey],
    companyId: crmData.company.companyId,
    invoiceAccountId: crmData.invoiceAccount.invoiceAccountId
  })
  .save();

const tearDown = () =>
  bookshelf.knex('water.charge_versions')
    .where('is_test', true)
    .del();

exports.create = create;
exports.tearDown = tearDown;

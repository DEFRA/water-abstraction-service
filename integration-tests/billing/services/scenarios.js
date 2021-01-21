const Joi = require('@hapi/joi');
const promisePoller = require('promise-poller').default;

const { ROLES } = require('../../../src/lib/roles');

const server = require('../../../index');

const batches = require('./batches');
const licences = require('./licences');
const licenceAgreements = require('./licence-agreements');
const regions = require('./regions');
const chargeElements = require('./charge-elements');
const chargeVersions = require('./charge-versions');
const purposePrimary = require('./purpose-primary');
const purposeSecondary = require('./purpose-secondary');
const purposeUses = require('./purpose-uses');
const crm = require('./crm');
const data = require('./data');
const returns = require('./returns');
const returnRequirements = require('./return-requirements');

const schema = {
  licence: Joi.string().required(),
  licenceAgreement: Joi.string().optional(),
  chargeVersions: Joi.array().items({
    company: Joi.string().required(),
    invoiceAccount: Joi.string().required(),
    chargeVersion: Joi.string().required(),
    chargeElements: Joi.array().items(
      Joi.string()
    ).required()
  }).required(),
  returns: Joi.array().items({
    return: Joi.string().required(),
    version: Joi.string().required(),
    lines: Joi.array().items(
      Joi.string().required()
    ).required(),
    returnRequirement: Joi.string().required()
  }).optional()
};

/**
 * Gets/creates the CRM entities needed for the specified charge version
 * @param {Object} chargeVersion
 * @return {Promise<Object>}
 */
const createCRMChargeVersionData = async chargeVersion => {
  console.log('Create charge version', chargeVersion);
  const company = await crm.createCompany(chargeVersion.company);
  const invoiceAccount = await crm.createInvoiceAccount(
    chargeVersion.invoiceAccount
  );

  return { company, invoiceAccount };
};

const createChargeElement = async (chargeVersion, key) => {
  // Create purposes
  const notData = { ...data };
  const [primary, secondary, use] = await Promise.all([
    purposePrimary.createAndGetId(notData.chargeElements[key].purposePrimary),
    purposeSecondary.createAndGetId(notData.chargeElements[key].purposeSecondary),
    purposeUses.createAndGetId(notData.chargeElements[key].purposeUse)
  ]);

  chargeVersion.set('purposePrimaryId', primary.get('purposePrimaryId'));
  chargeVersion.set('purposeSecondaryId', secondary.get('purposeSecondaryId'));
  chargeVersion.set('purposeUseId', use.get('purposeUseId'));

  return chargeElements.create(chargeVersion, key);
};

/**
 * Creates a new scenario in the database based on the provided description
 * @param {Object} scenario
 * @return {String} test region ID
 */
const createScenario = async scenario => {
  Joi.assert(scenario, schema);

  const region = await regions.createTestRegion();
  const licence = await licences.create(region, scenario.licence);
  if (scenario.licenceAgreement) {
    await licenceAgreements.create(licence, scenario.licenceAgreement);
  }
  await crm.createDocuments(scenario.licence);
  for (const row of scenario.chargeVersions) {
    const crmData = await createCRMChargeVersionData(row);
    const chargeVersion = await chargeVersions.create(region, licence, row.chargeVersion, crmData);

    const tasks = row.chargeElements.map(key => createChargeElement(chargeVersion, key));
    await Promise.all(tasks);
  }
  if (scenario.returns) {
    for (const row of scenario.returns) {
      // create return
      const tempRow = { ...row };
      await returnRequirements.create(tempRow, licence.get('licenceId'));
      await returns.create(tempRow, licence.get('licenceRef'));
    }
  }
  return region.get('regionId');
};

/**
 * Run scenario by setting up database and injecting into hapi server
 * @param {Object} scenario
 * @param {String} batchType
 * @param {Number} [financialYearEnding] - defaults to 2020
 * @param {Boolean} [isSummer]
 * @return {String} batchId
 */
const runScenario = async (scenario, batchType, financialYearEnding = 2020, isSummer = false) => {
  await server._start();
  // Set up test data in database
  const regionId = await createScenario(scenario);

  const response = await server.inject({
    auth: {
      strategy: 'jwt',
      credentials: {
        scope: [ROLES.billing]
      }
    },
    method: 'POST',
    url: '/water/1.0/billing/batches',
    payload: {
      userEmail: 'test@example.com',
      regionId,
      batchType,
      financialYearEnding,
      isSummer
    }
  });
  const batchId = JSON.parse(response.payload).data.batch.id;

  return getBatchWhenProcessed(batchId);
};

/**
 * Gets batch by ID.
 * If batch is not processed, an error is thrown
 * @param {String} batchId
 * @return {Promise<Object>}
 */
const getProcessedBatch = async batchId => {
  console.log(`Test: polling batch ${batchId}`);
  const batch = await batches.getBatchById(batchId);
  if (batch.get('status') === 'processing') {
    throw new Error('Batch still processing');
  }
  return batch.toJSON();
};

/**
 * Gets batch when processing is complete
 * @return {Promise}
 */
const getBatchWhenProcessed = batchId => promisePoller({
  taskFn: () => getProcessedBatch(batchId),
  interval: 5000,
  retries: 30
});

/**
   * Approves the review stage of a two part tariff batch, the water
   * service will then kick off the next job to continue processing
   * the batch
   *
   * @param {String} batchId UUID of the batch to approve review on
   */
const approveTwoPartTariffBatch = async (batchId) => {
  await server.inject({
    auth: {
      strategy: 'jwt',
      credentials: {
        scope: [ROLES.billing],
        id: 0,
        email: 'mail@example.com'
      }
    },
    method: 'POST',
    url: `/water/1.0/billing/batches/${batchId}/approve-review`
  });

  return getBatchWhenProcessed(batchId);
};

exports.approveTwoPartTariffBatch = approveTwoPartTariffBatch;
exports.runScenario = runScenario;
exports.createScenario = createScenario;

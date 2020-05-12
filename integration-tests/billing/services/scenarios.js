const Joi = require('@hapi/joi');
const promisePoller = require('promise-poller').default;

const server = require('../../../index');

const batches = require('./batches');
const licences = require('./licences');
const regions = require('./regions');
const chargeElements = require('./charge-elements');
const chargeVersions = require('./charge-versions');
const tearDown = require('./tear-down');
const crm = require('./crm');

const schema = {
  licence: Joi.string().required(),
  chargeVersions: Joi.array().items({
    company: Joi.string().required(),
    invoiceAccount: Joi.object({
      company: Joi.string().required(),
      invoiceAccount: Joi.string().required()
    }),
    chargeVersion: Joi.string().required(),
    chargeElements: Joi.array().items(
      Joi.string()
    ).required()
  }).required()
};

/**
 * Gets/creates the CRM entities needed for the specified charge version
 * @param {Object} chargeVersion
 * @return {Promise<Object>}
 */
const createCRMData = async chargeVersion => {
  const company = await crm.getOrCreateCompany(chargeVersion.company);
  const invoiceAccount = await crm.getOrCreateInvoiceAccount(
    chargeVersion.invoiceAccount.company,
    chargeVersion.invoiceAccount.invoiceAccount
  );
  return { company, invoiceAccount };
};

/**
 * Creates a new scenario in the database based on the provided description
 * @param {Object} scenario
 * @return {String} test region ID
 */
const createScenario = async scenario => {
  Joi.assert(scenario, schema);
  await tearDown.tearDown();
  const region = await regions.createTestRegion();
  const licence = await licences.create(region, scenario.licence);
  for (const row of scenario.chargeVersions) {
    const crmData = await createCRMData(row);
    const chargeVersion = await chargeVersions.create(region, licence, row.chargeVersion, crmData);
    const tasks = row.chargeElements.map(key => chargeElements.create(chargeVersion, key));
    await Promise.all(tasks);
  }
  return region.get('regionId');
};

/**
 * Run scenario by setting up database and injecting into hapi server
 * @param {Object} scenario
 * @param {String} batchType
 * @param {Boolean} [isSummer]
 * @return {String} batchId
 */
const runScenario = async (scenario, batchType, isSummer = false) => {
  await server._start();

  // Set up test data in database
  const regionId = await createScenario(scenario);

  const response = await server.inject({
    auth: {
      strategy: 'jwt',
      credentials: {
      }
    },
    method: 'POST',
    url: '/water/1.0/billing/batches',
    payload: {
      userEmail: 'test@example.com',
      regionId,
      batchType,
      financialYearEnding: 2020,
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
  interval: 2000,
  retries: 30
});

exports.runScenario = runScenario;

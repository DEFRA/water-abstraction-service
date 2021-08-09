'use strict';

const { get } = require('lodash');
const Boom = require('@hapi/boom');
const bluebird = require('bluebird');

const returns = require('./lib/returns');
const returnVersions = require('./lib/return-versions');
const returnRequirements = require('./lib/return-requirements');
const returnRequirementPurposes = require('./lib/return-requirements-purposes');
const permits = require('./lib/permits');
const entities = require('./lib/entities');
const transactions = require('./lib/billing-transactions');
const invoiceLicences = require('./lib/billing-invoice-licences');
const invoices = require('./lib/billing-invoices');
const batches = require('./lib/billing-batches');
const chargeVersionWorkflows = require('./lib/charge-version-workflows');
const licenceVersions = require('./lib/licence-versions');
const licences = require('./lib/licences');
const users = require('./lib/users');
const notifications = require('./lib/notifications');
const documents = require('./lib/documents');
const events = require('./lib/events');
const sessions = require('./lib/sessions');
const purposes = require('./lib/purposes');
const chargeTestDataTearDown = require('../../../integration-tests/billing/services/tear-down');

const setLoader = require('../../../integration-tests/billing/services/loader');

const {
  TEST_EXTERNAL_USER_EMAIL,
  TEST_EXTERNAL_AGENT_EMAIL,
  TEST_EXTERNAL_RETURNS_AGENT_EMAIL,
  LICENCE_REF_CURRENT_DAILY,
  LICENCE_REF_CURRENT_WEEKLY,
  LICENCE_REF_CURRENT_MONTHLY,
  LICENCE_REF_CURRENT_MONTHLY_NO_RETURN
} = require('./lib/constants');

const createExternalPrimaryUser = async company => {
  const individual = await entities.createIndividual(TEST_EXTERNAL_USER_EMAIL);
  await entities.createEntityRole(individual.entity_id, company.entity_id);
  const user = await users.createExternalUser(TEST_EXTERNAL_USER_EMAIL, individual.entity_id);

  return {
    entity: individual,
    user
  };
};

const createAgent = async (company, hasReturnsAccess = false) => {
  const email = hasReturnsAccess ? TEST_EXTERNAL_RETURNS_AGENT_EMAIL : TEST_EXTERNAL_AGENT_EMAIL;
  const role = hasReturnsAccess ? 'user_returns' : 'user';
  const individual = await entities.createIndividual(email);
  await entities.createEntityRole(individual.entity_id, company.entity_id, role);
  const user = await users.createExternalUser(email, individual.entity_id);

  return {
    entity: individual,
    user
  };
};

const createPermits = () => Promise.all([
  permits.createCurrentLicence(LICENCE_REF_CURRENT_DAILY),
  permits.createCurrentLicence(LICENCE_REF_CURRENT_WEEKLY),
  permits.createCurrentLicence(LICENCE_REF_CURRENT_MONTHLY)
]);

const createDocuments = (company, dailyPermit, weeklyPermit, monthlyPermit, companyV2Id, addressId) => {
  return Promise.all([
    documents.create(company.entity_id, dailyPermit.licence_id, LICENCE_REF_CURRENT_DAILY, companyV2Id, addressId),
    documents.create(company.entity_id, weeklyPermit.licence_id, LICENCE_REF_CURRENT_WEEKLY, companyV2Id, addressId),
    documents.create(company.entity_id, monthlyPermit.licence_id, LICENCE_REF_CURRENT_MONTHLY, companyV2Id, addressId)
  ]);
};

const createLicences = (company, dailyPermit, weeklyPermit, monthlyPermit) => {
  return Promise.all([
    licences.create(company.entity_id, dailyPermit.licence_id, LICENCE_REF_CURRENT_DAILY),
    licences.create(company.entity_id, weeklyPermit.licence_id, LICENCE_REF_CURRENT_WEEKLY),
    licences.create(company.entity_id, monthlyPermit.licence_id, LICENCE_REF_CURRENT_MONTHLY)
  ]);
};

const createReturns = () => Promise.all([
  returns.createDueReturn(LICENCE_REF_CURRENT_DAILY, 'day', '9999991'),
  returns.createDueReturn(LICENCE_REF_CURRENT_WEEKLY, 'week', '9999992'),
  returns.createDueReturn(LICENCE_REF_CURRENT_MONTHLY, 'month', '9999993'),
  returns.createDueReturn(LICENCE_REF_CURRENT_MONTHLY, 'month', '9999994', true)
]);

const createReturnVersions = (dailyDocumentV2, weeklyDocumentV2, monthlyDocumentV2) => Promise.all([
  returnVersions.create(dailyDocumentV2, '9999991'),
  returnVersions.create(weeklyDocumentV2, '9999992'),
  returnVersions.create(monthlyDocumentV2, '9999993'),
  returnVersions.create(monthlyDocumentV2, '9999994')
]);

const createReturnRequirements = (dailyReturnVer, weeklyReturnVer, monthlyReturnVer1, monthlyReturnVer2) => Promise.all([
  returnRequirements.create(dailyReturnVer, 'day', '9999991'),
  returnRequirements.create(weeklyReturnVer, 'week', '9999992'),
  returnRequirements.create(monthlyReturnVer1, 'month', '9999993'),
  returnRequirements.create(monthlyReturnVer2, 'month', '9999994')
]);

const createReturnRequirementPurposes = (dailyReturnReq, weeklyReturnReq, monthlyReturnReq1, monthlyReturnReq2, purpose) => Promise.all([
  returnRequirementPurposes.create(dailyReturnReq.returnRequirementId, '9999991', purpose),
  returnRequirementPurposes.create(weeklyReturnReq.returnRequirementId, '9999992', purpose),
  returnRequirementPurposes.create(monthlyReturnReq1.returnRequirementId, '9999993', purpose),
  returnRequirementPurposes.create(monthlyReturnReq2.returnRequirementId, '9999994', purpose)
]);

const createCurrentLicencesWithReturns = async (company, externalPrimaryUser, companyV2Id, addressId, purpose) => {
  const [dailyPermit, weeklyPermit, monthlyPermit] = await createPermits();

  const [
    dailyDocument,
    weeklyDocument,
    monthlyDocument
  ] = await createDocuments(company, dailyPermit, weeklyPermit, monthlyPermit, companyV2Id, addressId);

  const [
    dailyDocumentV2,
    weeklyDocumentV2,
    monthlyDocumentV2
  ] = await createLicences(company, dailyPermit, weeklyPermit, monthlyPermit);

  const [dailyReturn, weeklyReturn, monthlyReturn1, monthlyReturn2] = await createReturns();
  const [
    dailyReturnVersion,
    weeklyReturnVersion,
    monthlyReturnVersion1,
    monthlyReturnVersion2
  ] = await createReturnVersions(dailyDocumentV2, weeklyDocumentV2, monthlyDocumentV2);

  // create return requirements
  const [
    dailyReturnRequirement,
    weeklyReturnRequirement,
    monthlyReturnRequirement1,
    monthlyReturnRequirement2
  ] = await createReturnRequirements(dailyReturnVersion, weeklyReturnVersion, monthlyReturnVersion1, monthlyReturnVersion2);
    // create return requirements purposes
  const [
    dailyReturnReqPurpose,
    weeklyReturnReqPurpose,
    monthlyReturnReqPurpose1,
    monthlyReturnReqPurpose2
  ] = await createReturnRequirementPurposes(dailyReturnRequirement, weeklyReturnRequirement, monthlyReturnRequirement1, monthlyReturnRequirement2, purpose);
  return {
    company,
    externalPrimaryUser,
    permits: {
      daily: dailyPermit,
      weekly: weeklyPermit,
      monthly: monthlyPermit
    },
    document: {
      daily: dailyDocument,
      weekly: weeklyDocument,
      monthly: monthlyDocument
    },
    documentV2: {
      daily: dailyDocumentV2,
      weekly: weeklyDocumentV2,
      monthly: monthlyDocumentV2
    },
    returns: {
      daily: dailyReturn,
      weekly: weeklyReturn,
      monthly: {
        monthlyReturn1,
        monthlyReturn2
      }
    },
    returnRequirements: {
      daily: dailyReturnRequirement,
      weekly: weeklyReturnRequirement,
      monthly: {
        monthlyReturnRequirement1,
        monthlyReturnRequirement2
      },
      data: {
        dailyReturnReqPurpose,
        weeklyReturnReqPurpose,
        monthlyReturnReqPurpose1,
        monthlyReturnReqPurpose2
      }
    }
  };
};

const createLicencesWithNoReturns = async (company, companyV2Id, addressId) => {
  const monthlyPermit = await permits.createCurrentLicence(LICENCE_REF_CURRENT_MONTHLY_NO_RETURN);
  const monthlyDocument = await documents.create(company.entity_id, monthlyPermit.licence_id, LICENCE_REF_CURRENT_MONTHLY_NO_RETURN, companyV2Id, addressId);
  const monthlyDocumentV2 = await licences.create(company.entity_id, monthlyPermit.licence_id, LICENCE_REF_CURRENT_MONTHLY_NO_RETURN);
  return { monthlyDocument, monthlyDocumentV2 };
};

/**
 * National Permitting Service and Digitise! editor Send renewals and digitise licence information.
 National Permitting Service and Digitise! approver Send renewals, digitise licence information and approve changes.
 */
const createInternalUsers = async () => {
  const emailRegex = /acceptance-test\.internal\.(\w*)@defra\.gov\.uk/;

  const toCreate = [
    { group: 'super' },
    { group: 'wirs' },
    { group: 'nps' },
    { id: 'nps_digitise', group: 'nps', roles: ['ar_user'] },
    { id: 'nps_digitise_approver', group: 'nps', roles: ['ar_user', 'ar_approver'] },
    { group: 'environment_officer' },
    { group: 'billing_and_data' },
    { group: 'psc' }
  ];
  const createdUsers = await Promise.all(
    toCreate.map(async user => {
      const email = `acceptance-test.internal.${user.id || user.group}@defra.gov.uk`;

      return await users.createInternalUser(email, user.group, user.roles);
    })
  );
  return createdUsers
    .reduce((users, user) => {
      const id = user.user_name.replace(emailRegex, '$1');
      users[id] = user;
      return users;
    }, {});
};

const createAgents = async (company) => {
  const [agent, agentWithReturns] = await Promise.all([
    createAgent(company, false),
    createAgent(company, true)
  ]);

  return { agent, agentWithReturns };
};

const postSetup = async (request) => {
  await postTearDown();
  const includeAgents = get(request, 'payload.includeAgents', false);
  const includeInternalUsers = get(request, 'payload.includeInternalUsers', false);

  try {
    const company = await entities.createV1Company();
    const companyV2 = await entities.createV2Company();
    const address = await entities.createV2Address();
    await notifications.create();
    const externalPrimaryUser = await createExternalPrimaryUser(company);
    const purpose = await purposes.create();
    const currentLicencesWithReturns = await createCurrentLicencesWithReturns(company, externalPrimaryUser, companyV2.companyId, address.addressId, purpose);
    const currentLicenceNoReturns = await createLicencesWithNoReturns(company, companyV2.companyId, address.addressId);
    // Todo create invoice account that connects the company to the doc
    const responseData = { currentLicencesWithReturns, currentLicenceNoReturns };

    if (includeInternalUsers) {
      responseData.internalUsers = await createInternalUsers();
    }

    if (includeAgents) {
      responseData.agents = await createAgents(company);
    }

    return responseData;
  } catch (err) {
    return err;
  }
};

const postSetupFromYaml = async (request, h) => {
  const { key } = request.params;
  const set = require('../../../integration-tests/billing/fixtures/sets.json');

  if (!set[key]) {
    return Boom.notFound(`Key ${key} did not match any available Yaml sets.`);
  }

  // Create a set loader
  const loader = setLoader.createSetLoader();

  // Load YAML files in series
  await bluebird.mapSeries(set[key],
    ({ service, file }) => loader.load(service, file)
  );

  return h.response().code(204);
};

const postTearDown = async () => {
  console.log('Tearing down acceptance test charge data');
  await chargeTestDataTearDown.tearDown();
  console.log('Tearing down acceptance test returns');
  await returns.delete();
  console.log('Tearing down acceptance test return requirement purposes');
  await returnRequirementPurposes.delete();
  console.log('Tearing down acceptance test return requirements');
  await returnRequirements.delete();
  console.log('Tearing down acceptance test return versions');
  await returnVersions.delete();
  console.log('Tearing down acceptance test notifications');
  await notifications.delete();
  console.log('Tearing down acceptance test events');
  await events.delete();
  console.log('Tearing down acceptance test permits');
  await permits.delete();
  console.log('Tearing down acceptance test entities');
  await entities.delete();
  console.log('Tearing down acceptance test documents');
  await documents.delete();
  console.log('Tearing down acceptance test users');
  await users.delete();
  console.log('Tearing down acceptance test sessions');
  await sessions.delete();
  console.log('Tearing down acceptance test charge version workflows');
  await chargeVersionWorkflows.delete();
  console.log('Tearing down acceptance test transactions');
  await transactions.delete();
  console.log('Tearing down acceptance test invoiceLicences');
  await invoiceLicences.delete();
  console.log('Tearing down acceptance test invoices');
  await invoices.delete();
  console.log('Tearing down acceptance test batches');
  await batches.delete();
  console.log('Tearing down acceptance test licence versions');
  await licenceVersions.delete();
  console.log('Tearing down acceptance test licences');
  await licences.delete();

  return 'tear down complete';
};

exports.postSetup = postSetup;
exports.postSetupFromYaml = postSetupFromYaml;
exports.postTearDown = postTearDown;

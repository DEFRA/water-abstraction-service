const returns = require('./lib/returns');
const permits = require('./lib/permits');
const entities = require('./lib/entities');
const users = require('./lib/users');
const documents = require('./lib/documents');
const events = require('./lib/events');
const sessions = require('./lib/sessions');
const {
  TEST_EXTERNAL_USER_EMAIL,
  TEST_EXTERNAL_AGENT_EMAIL,
  TEST_EXTERNAL_RETURNS_AGENT_EMAIL,
  LICENCE_REF_CURRENT_DAILY,
  LICENCE_REF_CURRENT_WEEKLY,
  LICENCE_REF_CURRENT_MONTHLY
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

const createDocuments = (company, dailyPermit, weeklyPermit, monthlyPermit) => {
  return Promise.all([
    documents.create(company.entity_id, dailyPermit.licence_id, LICENCE_REF_CURRENT_DAILY),
    documents.create(company.entity_id, weeklyPermit.licence_id, LICENCE_REF_CURRENT_WEEKLY),
    documents.create(company.entity_id, monthlyPermit.licence_id, LICENCE_REF_CURRENT_MONTHLY)
  ]);
};

const createReturns = () => Promise.all([
  returns.createDueReturn(LICENCE_REF_CURRENT_DAILY, 'day'),
  returns.createDueReturn(LICENCE_REF_CURRENT_WEEKLY, 'week'),
  returns.createDueReturn(LICENCE_REF_CURRENT_MONTHLY, 'month')
]);

const createCurrentLicencesWithReturns = async (company, externalPrimaryUser) => {
  const [dailyPermit, weeklyPermit, monthlyPermit] = await createPermits();

  const [
    dailyDocument,
    weeklyDocument,
    monthlyDocument
  ] = await createDocuments(company, dailyPermit, weeklyPermit, monthlyPermit);

  const [dailyReturn, weeklyReturn, monthlyReturn] = await createReturns();

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
    returns: {
      daily: dailyReturn,
      weekly: weeklyReturn,
      monthly: monthlyReturn
    }
  };
};

const createInternalUsers = async () => {
  const groups = ['super', 'wirs', 'nps', 'environment_officer', 'billing_and_data', 'psc'];

  const createdUsers = await Promise.all(
    groups.map(group => {
      const email = `acceptance-test.internal.${group}@defra.gov.uk`;
      return users.createInternalUser(email, group);
    })
  );

  return createdUsers.map(response => response.data);
};

const createAgents = async (company) => {
  const [agent, agentWithReturns] = await Promise.all([
    createAgent(company, false),
    createAgent(company, true)
  ]);

  return { agent, agentWithReturns };
};

const postSetup = async (request, h) => {
  await postTearDown();

  try {
    const company = await entities.createCompany();
    const externalPrimaryUser = await createExternalPrimaryUser(company);
    const currentLicencesWithReturns = await createCurrentLicencesWithReturns(company, externalPrimaryUser);

    const responseData = { currentLicencesWithReturns };

    if (request.payload.includeInternalUsers) {
      responseData.internalUsers = await createInternalUsers();
    }

    if (request.payload.includeAgents) {
      responseData.agents = await createAgents(company);
    }

    return responseData;
  } catch (err) {
    return err;
  }
};

const postTearDown = async () => {
  await returns.delete();
  await events.delete();
  await permits.delete();
  await documents.delete();
  await entities.delete();
  await users.delete();
  await sessions.delete();

  return 'tear down complete';
};

exports.postSetup = postSetup;
exports.postTearDown = postTearDown;

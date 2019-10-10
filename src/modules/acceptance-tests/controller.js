const returns = require('./lib/returns');
const permits = require('./lib/permits');
const entities = require('./lib/entities');
const users = require('./lib/users');
const documents = require('./lib/documents');
const events = require('./lib/events');
const sessions = require('./lib/sessions');
const {
  TEST_EXTERNAL_USER_EMAIL,
  LICENCE_REF_CURRENT_DAILY,
  LICENCE_REF_CURRENT_WEEKLY,
  LICENCE_REF_CURRENT_MONTHLY
} = require('./lib/constants');

const createExternalPrimaryUser = async company => {
  const individual = await entities.createIndividual(TEST_EXTERNAL_USER_EMAIL);
  await entities.createEntityRole(individual.entity_id, company.entity_id);
  const user = await users.createExternalUser(individual.entity_id);

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

const postSetup = async () => {
  await postTearDown();

  try {
    const company = await entities.createCompany();
    const externalPrimaryUser = await createExternalPrimaryUser(company);
    const currentLicencesWithReturns = await createCurrentLicencesWithReturns(company, externalPrimaryUser);

    return {
      currentLicencesWithReturns
    };
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

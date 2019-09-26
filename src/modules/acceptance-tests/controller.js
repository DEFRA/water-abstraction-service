const returns = require('./lib/returns');
const permits = require('./lib/permits');
const entities = require('./lib/entities');
const users = require('./lib/users');
const documents = require('./lib/documents');
const events = require('./lib/events');
const sessions = require('./lib/sessions');
const { TEST_EXTERNAL_USER_EMAIL, LICENCE_REF_CURRENT } = require('./lib/constants');

const createExternalPrimaryUser = async company => {
  const individual = await entities.createIndividual(TEST_EXTERNAL_USER_EMAIL);
  await entities.createEntityRole(individual.entity_id, company.entity_id);
  const user = await users.createExternalUser(individual.entity_id);

  return {
    entity: individual,
    user
  };
};

const createCurrentLicenceWithReturn = async (company, externalPrimaryUser) => {
  const permit = await permits.createCurrentLicence(LICENCE_REF_CURRENT);
  const document = await documents.create(company.entity_id, permit.licence_id, LICENCE_REF_CURRENT);
  const licenceReturn = await returns.createDueReturn(LICENCE_REF_CURRENT);

  return {
    permit,
    company,
    externalPrimaryUser,
    document,
    return: licenceReturn
  };
};

const postSetup = async () => {
  await postTearDown();

  try {
    const company = await entities.createCompany();
    const externalPrimaryUser = await createExternalPrimaryUser(company);
    const currentLicenceWithReturn = await createCurrentLicenceWithReturn(company, externalPrimaryUser);

    return {
      currentLicenceWithReturn
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

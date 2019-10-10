const { usersClient } = require('../../../lib/connectors/idm');
const acceptanceTestsConnector = require('../../../lib/connectors/idm/acceptance-tests');

const {
  TEST_USER_PASSWORD,
  ACCEPTANCE_TEST_SOURCE,
  TEST_EXTERNAL_USER_EMAIL
} = require('./constants');

const createIdmUser = async (email, application, crmEntityId) => {
  const userData = {
    user_name: email,
    password: TEST_USER_PASSWORD,
    reset_required: 0,
    application,
    external_id: crmEntityId,
    bad_logins: 0,
    user_data: {
      source: ACCEPTANCE_TEST_SOURCE
    }
  };

  const { data: user } = await usersClient.create(userData);
  return user;
};

const createExternalUser = crmEntityId => createIdmUser(
  TEST_EXTERNAL_USER_EMAIL,
  'water_vml',
  crmEntityId
);

exports.createExternalUser = createExternalUser;
exports.delete = () => acceptanceTestsConnector.deleteAcceptanceTestData();

const { usersClient } = require('../../../lib/connectors/idm');
const { setInternalUserRoles } = require('../../../lib/connectors/idm/user-roles');

const {
  TEST_USER_PASSWORD,
  ACCEPTANCE_TEST_SOURCE
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

const createExternalUser = (email, crmEntityId) =>
  createIdmUser(email, 'water_vml', crmEntityId);

const createInternalUser = async (email, group, roles = []) => {
  const user = await createIdmUser(email, 'water_admin', null);
  const userWithRoles = await setInternalUserRoles(user.user_id, roles, [group]);

  return userWithRoles.data;
};

exports.createExternalUser = createExternalUser;
exports.createInternalUser = createInternalUser;

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const userRolesConnector = require('../../../../src/lib/connectors/idm/user-roles');
const config = require('../../../../config');

const { serviceRequest } = require('@envage/water-abstraction-helpers');

experiment('connectors/idm/user-roles', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'put');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setInternalUserRoles', () => {
    let userId;
    let roles;
    let groups;

    beforeEach(async () => {
      userId = 'test-user-id';
      roles = ['RoleA'];
      groups = ['GroupA', 'GroupB'];
      userRolesConnector.setInternalUserRoles(userId, roles, groups);
    });

    test('uses the expected url', async () => {
      const [url] = serviceRequest.put.lastCall.args;
      const expected = `${config.services.idm}/user/${userId}/roles`;
      expect(url).to.equal(expected);
    });

    test('sets the application in the request body', async () => {
      const [, { body }] = serviceRequest.put.lastCall.args;
      expect(body.application).to.equal(config.idm.application.internalUser);
    });

    test('sets the roles in the request body', async () => {
      const [, { body }] = serviceRequest.put.lastCall.args;
      expect(body.roles).to.equal(roles);
    });

    test('sets the groups in the request body', async () => {
      const [, { body }] = serviceRequest.put.lastCall.args;
      expect(body.groups).to.equal(groups);
    });
  });
});

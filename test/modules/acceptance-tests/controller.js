'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const users = require('../../../src/modules/acceptance-tests/lib/users');
const entities = require('../../../src/modules/acceptance-tests/lib/entities');
const permits = require('../../../src/modules/acceptance-tests/lib/permits');
const documents = require('../../../src/modules/acceptance-tests/lib/documents');
const returns = require('../../../src/modules/acceptance-tests/lib/returns');
const events = require('../../../src/modules/acceptance-tests/lib/events');
const sessions = require('../../../src/modules/acceptance-tests/lib/sessions');
const licences = require('../../../src/modules/acceptance-tests/lib/licences');

const controller = require('../../../src/modules/acceptance-tests/controller');
const chargeTestDataTearDown = require('../../../integration-tests/billing/services/tear-down');

experiment('modules/acceptance-tests/controller', () => {
  beforeEach(async () => {
    sandbox.stub(entities, 'createV1Company').resolves({
      entity_id: 'test-company'
    });

    sandbox.stub(entities, 'createV2Company').resolves({
    });

    sandbox.stub(entities, 'createV2Address').resolves({
    });

    sandbox.stub(entities, 'createIndividual').callsFake(email => {
      return Promise.resolve({
        entity_nm: email
      });
    });

    sandbox.stub(entities, 'createEntityRole').resolves();

    sandbox.stub(users, 'createExternalUser').callsFake(email => {
      return Promise.resolve({
        user_name: email
      });
    });

    sandbox.stub(users, 'createInternalUser').callsFake((email, group, roles = []) => {
      return Promise.resolve({
        user_name: email,
        groups: [group],
        roles
      });
    });

    sandbox.stub(permits, 'createCurrentLicence').resolves({});
    sandbox.stub(documents, 'create').resolves({});
    sandbox.stub(licences, 'create').resolves({});
    sandbox.stub(returns, 'createDueReturn').resolves({});

    sandbox.stub(returns, 'delete').resolves();
    sandbox.stub(events, 'delete').resolves();
    sandbox.stub(permits, 'delete').resolves();
    sandbox.stub(documents, 'delete').resolves();
    sandbox.stub(entities, 'delete').resolves();
    sandbox.stub(users, 'delete').resolves();
    sandbox.stub(sessions, 'delete').resolves();
    sandbox.stub(licences, 'delete').resolves();
    sandbox.stub(chargeTestDataTearDown, 'tearDown').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postSetup', () => {
    experiment('when called with no extra payload', () => {
      let response;
      beforeEach(async () => {
        const request = { payload: {} };
        response = await controller.postSetup(request);
      });

      test('the existing data is torn down', async () => {
        expect(returns.delete.called).to.be.true();
        expect(events.delete.called).to.be.true();
        expect(permits.delete.called).to.be.true();
        expect(documents.delete.called).to.be.true();
        expect(entities.delete.called).to.be.true();
        expect(users.delete.called).to.be.true();
        expect(sessions.delete.called).to.be.true();
        expect(licences.delete.called).to.be.true();
      });

      test('the expected current licence response is created', async () => {
        const data = response.currentLicencesWithReturns;

        expect(data.company.entity_id).to.equal('test-company');
        expect(data.externalPrimaryUser.user.user_name).to.equal('acceptance-test.external@example.com');
        expect(data.externalPrimaryUser.entity.entity_nm).to.equal('acceptance-test.external@example.com');
        expect(data.permits.daily).to.exist();
        expect(data.permits.weekly).to.exist();
        expect(data.permits.monthly).to.exist();
        expect(data.document.daily).to.exist();
        expect(data.document.weekly).to.exist();
        expect(data.document.monthly).to.exist();
        expect(data.returns.daily).to.exist();
        expect(data.returns.weekly).to.exist();
        expect(data.returns.monthly).to.exist();
      });

      test('there are no agents', async () => {
        expect(response.agents).to.not.exist();
      });

      test('there are no internal users created', async () => {
        expect(response.internalUsers).to.not.exist();
      });
    });

    experiment('when the agents are requested', () => {
      let response;

      beforeEach(async () => {
        const request = {
          payload: {
            includeAgents: true
          }
        };
        response = await controller.postSetup(request);
      });

      test('a basic agent is created', async () => {
        const email = 'acceptance-test.agent@example.com';
        expect(response.agents.agent.entity.entity_nm).to.equal(email);
        expect(response.agents.agent.user.user_name).to.equal(email);
      });

      test('a returns agent is created', async () => {
        const email = 'acceptance-test.returns-agent@example.com';
        expect(response.agents.agentWithReturns.entity.entity_nm).to.equal(email);
        expect(response.agents.agentWithReturns.user.user_name).to.equal(email);
      });

      test('there are no internal users created', async () => {
        expect(response.internalUsers).to.not.exist();
      });
    });

    experiment('when internal users are requested', async () => {
      let response;

      beforeEach(async () => {
        const request = {
          payload: {
            includeInternalUsers: true
          }
        };
        response = await controller.postSetup(request);
      });

      test('a super user is created', async () => {
        const user = response.internalUsers.super;
        expect(user.user_name).to.equal('acceptance-test.internal.super@defra.gov.uk');
        expect(user.groups).to.equal(['super']);
        expect(user.roles).to.equal([]);
      });

      test('a wirs user is created', async () => {
        const user = response.internalUsers.wirs;
        expect(user.user_name).to.equal('acceptance-test.internal.wirs@defra.gov.uk');
        expect(user.groups).to.equal(['wirs']);
        expect(user.roles).to.equal([]);
      });

      test('an nps user is created', async () => {
        const user = response.internalUsers.nps;
        expect(user.user_name).to.equal('acceptance-test.internal.nps@defra.gov.uk');
        expect(user.groups).to.equal(['nps']);
        expect(user.roles).to.equal([]);
      });

      test('an nps user is created with digitise roles', async () => {
        const user = response.internalUsers.nps_digitise;
        expect(user.user_name).to.equal('acceptance-test.internal.nps_digitise@defra.gov.uk');
        expect(user.groups).to.equal(['nps']);
        expect(user.roles).to.equal(['ar_user']);
      });

      test('an nps user is created with digitise approval roles', async () => {
        const user = response.internalUsers.nps_digitise_approver;
        expect(user.user_name).to.equal('acceptance-test.internal.nps_digitise_approver@defra.gov.uk');
        expect(user.groups).to.equal(['nps']);
        expect(user.roles).to.equal(['ar_user', 'ar_approver']);
      });

      test('an environment officer user is created', async () => {
        const user = response.internalUsers.environment_officer;
        expect(user.user_name).to.equal('acceptance-test.internal.environment_officer@defra.gov.uk');
        expect(user.groups).to.equal(['environment_officer']);
        expect(user.roles).to.equal([]);
      });

      test('a billing and data user is created', async () => {
        const user = response.internalUsers.billing_and_data;
        expect(user.user_name).to.equal('acceptance-test.internal.billing_and_data@defra.gov.uk');
        expect(user.groups).to.equal(['billing_and_data']);
        expect(user.roles).to.equal([]);
      });

      test('a psc user is created', async () => {
        const user = response.internalUsers.psc;
        expect(user.user_name).to.equal('acceptance-test.internal.psc@defra.gov.uk');
        expect(user.groups).to.equal(['psc']);
        expect(user.roles).to.equal([]);
      });
    });
  });

  experiment('postTearDown', () => {
    test('deletes the test data that has been created', async () => {
      await controller.postTearDown();
      expect(returns.delete.called).to.be.true();
      expect(events.delete.called).to.be.true();
      expect(permits.delete.called).to.be.true();
      expect(documents.delete.called).to.be.true();
      expect(entities.delete.called).to.be.true();
      expect(users.delete.called).to.be.true();
      expect(sessions.delete.called).to.be.true();
    });
  });
});

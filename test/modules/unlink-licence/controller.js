const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const controller = require('../../../src/modules/unlink-licence/controller');
const crmDocumentsConnector = require('../../../src/lib/connectors/crm/documents');
const idmConnector = require('../../../src/lib/connectors/idm');
const Boom = require('@hapi/boom');
const event = require('../../../src/lib/event');
const { logger } = require('../../../src/logger');

const callingUserId = 123;

const request = {
  params: {
    documentId: 'doc-id'
  },
  payload: {
    callingUserId
  }
};

const h = {};

const user = {
  user_id: 123,
  user_name: 'test@example.com',
  roles: ['unlink_licences']
};

const document = {
  document_id: 'doc-id'
};

experiment('modules/unlink-licence/controller', () => {
  beforeEach(async () => {
    sandbox.stub(crmDocumentsConnector, 'unlinkLicence').resolves(document);
    sandbox.stub(idmConnector.usersClient, 'findOneById').resolves(user);
    sandbox.stub(event, 'create');
    sandbox.stub(event, 'save');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => { sandbox.restore(); });

  experiment('.patchUnlinkLicence', async () => {
    test('calls crmDocumentsConnector.unlinkLicence with documentId', async () => {
      await controller.patchUnlinkLicence(request, h);
      expect(crmDocumentsConnector.unlinkLicence.calledWith(request.params.documentId)).to.be.true();
    });

    test('returns the document', async () => {
      const result = await controller.patchUnlinkLicence(request, h);
      expect(result).to.equal(document);
    });

    test('calls logger.error if error is thrown', async () => {
      crmDocumentsConnector.unlinkLicence.throws(Boom.teapot('bad error'));
      const result = await controller.patchUnlinkLicence(request, h);
      const [message, err, body] = logger.error.lastCall.args;
      expect(message).to.equal('Failed to unlink licence');
      expect(err).to.equal(result);
      expect(body).to.equal({ callingUserId, documentId: request.params.documentId });
    });

    test('returns error if isBoom', async () => {
      crmDocumentsConnector.unlinkLicence.throws(Boom.teapot('bad error'));
      const result = await controller.patchUnlinkLicence(request, h);
      expect(result).to.be.an.error();
      expect(result.isBoom).to.be.true();
    });

    test('throws error if is not Boom', async () => {
      crmDocumentsConnector.unlinkLicence.throws('not a Boom error');
      try {
        await controller.patchUnlinkLicence(request, h);
      } catch (err) {
        expect(err).to.be.an.error();
        expect(err.isBoom).to.be.undefined();
      }
    });
  });

  experiment('.getCallingUser', async () => {
    test('calls idmConnector.usersClient.findOneById with callingUserId', async () => {
      await controller.getCallingUser(callingUserId);
      expect(idmConnector.usersClient.findOneById.calledWith(callingUserId)).to.be.true();
    });

    test('returns the user', async () => {
      const result = await controller.getCallingUser(callingUserId);
      expect(result).to.equal(user);
    });

    test('throws Boom.forbidden error if user not authorised', async () => {
      const unauthorisedUser = user;
      unauthorisedUser.roles = ['unauthorised'];
      idmConnector.usersClient.findOneById.resolves(unauthorisedUser);
      try {
        await controller.getCallingUser(callingUserId);
      } catch (err) {
        expect(err.isBoom).to.be.true();
        expect(err.output.statusCode).to.equal(403);
      }
    });
  });

  experiment('.createUnlinkLicenceEvent', async () => {
    test('calls event.create with expected arguments', async () => {
      await controller.createUnlinkLicenceEvent(user, document);
      expect(event.create.calledWith({
        type: 'unlink-licence',
        issuer: user.user_name,
        metadata: {
          documentId: document.document_id
        }
      })).to.be.true();
    });

    test('calls event.save with result of event.create', async () => {
      const eventData = { type: 'event-type', issuer: user.user_name, metadata: { some: 'data' } };
      event.create.returns(eventData);
      await controller.createUnlinkLicenceEvent(user, document);
      expect(event.save.calledWith(eventData)).to.be.true();
    });
  });
});

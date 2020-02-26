'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const plugin = require('../../src/plugins/internal-calling-user');
const idmConnector = require('../../src/lib/connectors/idm');
const { logger } = require('../../src/logger');

experiment('plugins/internal-calling-user', () => {
  let handler;
  let server;
  let h;

  beforeEach(async () => {
    server = {
      ext: sandbox.spy()
    };

    h = { continue: 'continue' };

    sandbox.stub(idmConnector.usersClient, 'findOneById').resolves();
    sandbox.stub(logger, 'error');

    await plugin.register(server);
    handler = server.ext.lastCall.args[0].method;
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('onPreHandler', () => {
    experiment('if no defra-internal-user-id header is present', () => {
      let response;
      let request;

      beforeEach(async () => {
        request = {
          headers: { }
        };
        response = await handler(request, h);
      });
      test('no call is made to get the user', async () => {
        expect(idmConnector.usersClient.findOneById.called).to.be.false();
      });

      test('h.continue is returned', async () => {
        expect(response).to.equal(h.continue);
      });
    });

    experiment('when the defra-internal-user-id header is present', () => {
      experiment('if the user is not found', () => {
        let response;

        beforeEach(async () => {
          idmConnector.usersClient.findOneById.rejects();
          response = await handler({
            headers: {
              'defra-internal-user-id': 1234
            }
          }, h);
        });

        test('the expected user id is user to query the IDM', async () => {
          expect(idmConnector.usersClient.findOneById.calledWith(1234)).to.be.true();
        });

        test('an error is returned', async () => {
          expect(response.output.payload.statusCode).to.equal(403);
          expect(response.output.payload.message).to.equal('User not acceptable');
          expect(response.data).to.equal({ userId: 1234 });
        });

        test('the error is logged', async () => {
          expect(logger.error.called).to.be.true();
        });
      });

      experiment('if the user is not internal', async () => {
        let response;

        beforeEach(async () => {
          idmConnector.usersClient.findOneById.resolves({
            user_id: 1234,
            application: 'not the right app'
          });

          response = await handler({
            headers: {
              'defra-internal-user-id': 1234
            }
          }, h);
        });

        test('the expected user id is user to query the IDM', async () => {
          expect(idmConnector.usersClient.findOneById.calledWith(1234)).to.be.true();
        });

        test('an error is returned', async () => {
          expect(response.output.payload.statusCode).to.equal(403);
          expect(response.output.payload.message).to.equal('User not acceptable');
          expect(response.data).to.equal({ userId: 1234 });
        });

        test('the error is logged', async () => {
          expect(logger.error.called).to.be.true();
        });
      });

      experiment('if an internal user is found', () => {
        let response;
        let request;

        beforeEach(async () => {
          idmConnector.usersClient.findOneById.resolves({
            user_id: 1234,
            user_name: 'test@example.com',
            application: 'water_admin'
          });
          request = {
            headers: {
              'defra-internal-user-id': 1234
            }
          };

          response = await handler(request, h);
        });

        test('h.continue is returned', async () => {
          expect(response).to.equal(h.continue);
        });

        test('the user is added to the request for later', async () => {
          expect(request.defra.internalCallingUser.id).to.equal(1234);
          expect(request.defra.internalCallingUser.email).to.equal('test@example.com');
        });
      });
    });
  });
});

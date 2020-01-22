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

const { http } = require('@envage/water-abstraction-helpers');

const config = require('../../../../config.js');
const ChargeModuleRequest = require('../../../../src/lib/connectors/charge-module/ChargeModuleRequest');
const { logger } = require('../../../../src/logger');

const data = {
  cognito: {
    url: 'https://example.com',
    username: 'username',
    password: 'password'
  },
  tokenResponse: {
    access_token: 'cognito_token',
    expires: 3600
  },
  cmResponse: {
    foo: 'bar'
  },
  request: {
    uri: 'https://example.com/some/path',
    qs: {
      bar: 'foo'
    },
    headers: {
      foo: 'baz'
    }
  }
};

experiment('lib/connectors/charge-module/ChargeModuleRequest', () => {
  let cmRequest, result;

  beforeEach(async () => {
    sandbox.stub(config.services, 'cognito').value(data.cognito.url);
    sandbox.stub(config.cognito, 'username').value(data.cognito.username);
    sandbox.stub(config.cognito, 'password').value(data.cognito.password);

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    sandbox.stub(http, 'request');

    cmRequest = new ChargeModuleRequest();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const testTokenIsRequested = () => test('a request is made to get the token', async () => {
    const [options] = http.request.firstCall.args;
    expect(options).to.equal({
      method: 'POST',
      json: true,
      uri: 'https://example.com/oauth2/token',
      qs: { grant_type: 'client_credentials' },
      headers:
       {
         'content-type': 'application/x-www-form-urlencoded',
         authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
       }
    });
  });

  experiment('when a token is not set', () => {
    experiment('and a token is retrieved successfully', () => {
      beforeEach(async () => {
        http.request.onCall(0).resolves(data.tokenResponse);
        http.request.onCall(1).resolves(data.cmResponse);
      });

      experiment('when a GET request is made', async () => {
        beforeEach(async () => {
          result = await cmRequest.get(data.request);
        });

        testTokenIsRequested();

        test('a GET request is made to the charge module using the obtained bearer token', async () => {
          const [options] = http.request.lastCall.args;
          expect(options).to.equal({
            uri: 'https://example.com/some/path',
            qs: { bar: 'foo' },
            headers: { foo: 'baz', Authorization: 'Bearer cognito_token' },
            method: 'GET'
          });
        });

        test('resolves with the data obtained from the charge module', async () => {
          expect(result).to.equal(data.cmResponse);
        });
      });

      experiment('when a POST request is made', async () => {
        beforeEach(async () => {
          result = await cmRequest.post(data.request);
        });

        testTokenIsRequested();

        test('a GET request is made to the charge module using the obtained bearer token', async () => {
          const [options] = http.request.lastCall.args;
          expect(options).to.equal({
            uri: 'https://example.com/some/path',
            qs: { bar: 'foo' },
            headers: { foo: 'baz', Authorization: 'Bearer cognito_token' },
            method: 'POST'
          });
        });

        test('resolves with the data obtained from the charge module', async () => {
          expect(result).to.equal(data.cmResponse);
        });
      });
    });
  });
});

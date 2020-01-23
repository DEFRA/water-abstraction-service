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
const moment = require('moment');

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
    expect(http.request.calledWith(
      {
        method: 'POST',
        json: true,
        uri: 'https://example.com/oauth2/token',
        qs: { grant_type: 'client_credentials' },
        headers:
           {
             'content-type': 'application/x-www-form-urlencoded',
             authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
           }
      }
    )).to.be.true();
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

  experiment('when a token is present but expired', () => {
    experiment('and a token is retrieved successfully', () => {
      beforeEach(async () => {
        // Simulate an expired token
        sandbox.stub(cmRequest, 'token').value('expired-token');
        sandbox.stub(cmRequest, 'expires').value(moment().subtract(10, 'second'));

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
    });
  });

  experiment('when a valid token is present', () => {
    beforeEach(async () => {
      // Simulate an expired token
      sandbox.stub(cmRequest, 'token').value('valid-token');
      sandbox.stub(cmRequest, 'expires').value(moment().add(100, 'second'));

      http.request.onCall(0).resolves(data.cmResponse);
    });

    experiment('when a GET request is made', async () => {
      beforeEach(async () => {
        result = await cmRequest.get(data.request);
      });

      test('only 1 request is made', async () => {
        expect(http.request.callCount).to.equal(1);
      });

      test('a GET request is made to the charge module using the existing bearer token', async () => {
        const [options] = http.request.lastCall.args;
        expect(options).to.equal({
          uri: 'https://example.com/some/path',
          qs: { bar: 'foo' },
          headers: { foo: 'baz', Authorization: 'Bearer valid-token' },
          method: 'GET'
        });
      });

      test('resolves with the data obtained from the charge module', async () => {
        expect(result).to.equal(data.cmResponse);
      });
    });
  });

  experiment('when a valid token is present', () => {
    experiment('and the charge module responds with 401 status code', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 401;

        // Simulate a valid token
        sandbox.stub(cmRequest, 'token').value('valid-token');
        sandbox.stub(cmRequest, 'expires').value(moment().add(100, 'second'));

        // Simulate the charge module responding with a 401 (unauthorised)
        http.request.onCall(0).rejects(err);
        http.request.onCall(1).resolves(data.tokenResponse);
        http.request.onCall(2).resolves(data.cmResponse);
      });

      experiment('when a GET request is made', async () => {
        beforeEach(async () => {
          result = await cmRequest.get(data.request);
        });

        test('3 requests are made', async () => {
          expect(http.request.callCount).to.equal(3);
        });

        testTokenIsRequested();

        test('a GET request is made to the charge module using the new bearer token', async () => {
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
    });
  });
});

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
const tunnel = require('tunnel');

const gotWithProxy = require('../../../../../src/lib/connectors/charge-module/lib/got-with-proxy');
const config = require('../../../../../config');

experiment('lib/connectors/charge-module/lib/got-with-proxy', () => {
  beforeEach(async () => {
    sandbox.stub(tunnel, 'httpsOverHttp');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.beforeRequestHook', () => {
    const proxy = 'http://test.test.defra.cloud:1234';
    let options;

    beforeEach(async () => {
      options = {};
    });

    test('when a proxy is not defined', async () => {
      gotWithProxy._beforeRequestHook(options);
      expect(options.agent).to.be.undefined();
    });

    experiment('when a proxy is defined', () => {
      beforeEach(async () => {
        sandbox.stub(config, 'proxy').value(proxy);
        gotWithProxy._beforeRequestHook(options);
      });

      test('the options.agent is set', async () => {
        expect(options.agent).to.be.an.object();
      });

      test('the tunnel agent is created with the correct host an port', async () => {
        expect(tunnel.httpsOverHttp.calledWith({
          proxy: {
            host: 'test.test.defra.cloud',
            port: 1234
          }
        })).to.be.true();
      });
    });
  });
});

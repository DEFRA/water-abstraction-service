'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const Address = require('../../../src/lib/models/address');
const controller = require('../../../src/modules/address-search/controller');

experiment('modules/application-state/controller', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddressSearch', () => {
    let request, result;

    beforeEach(async () => {
      request = {
        query: { q: 'TT1 1TT' },
        server: {
          methods: {
            getAddressesByPostcode: sandbox.stub().resolves({
              data: [
                new Address()
              ]
            })
          }
        }
      };
      result = await controller.getAddressSearch(request);
    });

    test('fetches the data via the server method', async () => {
      expect(request.server.methods.getAddressesByPostcode.calledWith('TT1 1TT')).to.be.true();
    });

    test('returns the data', async () => {
      expect(result.data).to.be.an.array().length(1);
      expect(result.data[0] instanceof Address).to.be.true();
    });
  });
});

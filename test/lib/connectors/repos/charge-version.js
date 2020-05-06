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

const { ChargeVersion } = require('../../../../src/lib/connectors/bookshelf');
const chargeVersions = require('../../../../src/lib/connectors/repos/charge-versions');

experiment('lib/connectors/repos/charge-versions', () => {
  let model, stub, result;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ chargeElementId: 'test-id' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model)
    };
    sandbox.stub(ChargeVersion, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    beforeEach(async () => {
      result = await chargeVersions.findOne('test-id');
    });

    test('.forge() is called with correct ID', async () => {
      expect(ChargeVersion.forge.calledWith({
        chargeVersionId: 'test-id'
      })).to.be.true();
    });

    test('.fetch() is called with related models', async () => {
      expect(stub.fetch.calledWith({
        withRelated: [
          'chargeElements',
          'chargeElements.purposePrimary',
          'chargeElements.purposeSecondary',
          'chargeElements.purposeUse',
          'licence',
          'licence.region',
          'licence.licenceAgreements'
        ]
      })).to.be.true();
    });

    test('calls model.toJSON()', async () => {
      expect(model.toJSON.called).to.be.true();
    });

    test('returns result of model.toJSON()', async () => {
      expect(result).to.equal({
        chargeElementId: 'test-id'
      });
    });
  });
});

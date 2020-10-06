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
const queries = require('../../../../src/lib/connectors/repos/queries/charge-versions');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

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
    sandbox.stub(raw, 'multiRow');
    sandbox.stub(helpers, 'update');
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
          'licence.licenceAgreements',
          'licence.licenceAgreements.financialAgreementType',
          'changeReason'
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

  experiment('.findValidInRegionAndFinancialYear', () => {
    const regionId = 'test-region-id';
    const financialYearEnding = 2020;

    beforeEach(async () => {
      await chargeVersions.findValidInRegionAndFinancialYear(regionId, financialYearEnding);
    });

    test('calls raw.multiRow with the expected query and params', async () => {
      const [query, params] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.findValidInRegionAndFinancialYear);
      expect(params).to.equal({
        regionId,
        startDate: '2019-04-01',
        endDate: '2020-03-31'
      });
    });
  });

  experiment('.update', () => {
    const id = 'test-id';
    const changes = { status: 'current' };

    test('delegates to helpers.update', async () => {
      await chargeVersions.update(id, changes);
      expect(helpers.update.calledWith(
        ChargeVersion,
        'chargeVersionId',
        id,
        changes
      ));
    });
  });
});

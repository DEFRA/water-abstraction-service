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

  const sharedRelations = [
    'chargeElements',
    'chargeElements.purposePrimary',
    'chargeElements.purposeSecondary',
    'chargeElements.purposeUse',
    'chargeElements.chargePurposes',
    'chargeElements.chargeCategory',
    'chargeElements.chargePurposes.purposePrimary',
    'chargeElements.chargePurposes.purposeSecondary',
    'chargeElements.chargePurposes.purposeUse',
    'licence',
    'licence.region',
    'licence.licenceAgreements',
    'licence.licenceAgreements.financialAgreementType',
    'changeReason'
  ];

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ chargeElementId: 'test-id' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      orderBy: sandbox.stub().returnsThis(),
      where: sandbox.stub().returnsThis(),
      fetchAll: sandbox.stub().resolves(model)
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
        withRelated: sharedRelations
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

  experiment('.findMany', () => {
    beforeEach(async () => {
      result = await chargeVersions.findMany(['test-id-1', 'test-id-2']);
    });

    test('.forge() is called', async () => {
      expect(ChargeVersion.forge.called).to.be.true();
    });

    test('.where() is called with expected params', async () => {
      expect(stub.where.calledWith(
        'charge_version_id',
        'in',
        ['test-id-1', 'test-id-2']
      )).to.be.true();
    });

    test('.fetchAll() is called with related models', async () => {
      expect(stub.fetchAll.calledWith({
        withRelated: ['changeReason']
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
        financialYearEnding
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

  experiment('.findByLicenceRef', () => {
    beforeEach(async () => {
      result = await chargeVersions.findByLicenceRef('test-licence-ref');
    });

    test('.where() is called with correct licence ref', async () => {
      const args = stub.where.lastCall.args;
      expect(args[0]).to.equal('licence_ref');
      expect(args[1]).to.equal('test-licence-ref');
    });

    test('.fetch() is called with related models', async () => {
      expect(stub.fetchAll.calledWith({
        withRelated: sharedRelations
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
  experiment('.findByLicenceId', () => {
    beforeEach(async () => {
      result = await chargeVersions.findByLicenceId('test-licence-id');
    });

    test('.where() is called with correct licence id', async () => {
      const args = stub.where.lastCall.args;
      expect(args[0]).to.equal('licence_id');
      expect(args[1]).to.equal('test-licence-id');
    });

    test('.fetch() is called with related models', async () => {
      expect(stub.fetchAll.calledWith({
        withRelated: sharedRelations
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

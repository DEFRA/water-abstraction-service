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

const repos = require('../../../../src/lib/connectors/repos');
const { BillingBatchChargeVersionYear, bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-batch-charge-version-years');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const { TRANSACTION_TYPE } = require('../../../../src/lib/models/charge-version-year');

experiment('lib/connectors/repos/billing-batch-charge-version-year', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };
    stub = {
      save: sandbox.stub().resolves(model),
      destroy: sandbox.stub().resolves(),
      fetch: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis()
    };
    sandbox.stub(BillingBatchChargeVersionYear, 'forge').returns(stub);
    sandbox.stub(BillingBatchChargeVersionYear, 'collection').returns(stub);
    sandbox.stub(raw, 'multiRow');
    sandbox.stub(helpers, 'findOne').resolves({ foo: 'bar' });
    sandbox.stub(helpers, 'findMany').resolves({ bar: 'baz' });
    sandbox.stub(bookshelf.knex, 'raw');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      result = await repos.billingBatchChargeVersionYears.findOne('test-id');
    });

    test('calls helpers .findOne() with the model and id params', async () => {
      const [model, idKey, id] = helpers.findOne.lastCall.args;
      expect(model).to.equal(BillingBatchChargeVersionYear);
      expect(idKey).to.equal('billingBatchChargeVersionYearId');
      expect(id).to.equal('test-id');
    });

    test('passes the correct related models', async () => {
      const withRelated = helpers.findOne.lastCall.args[3];
      expect(withRelated).to.equal([
        'billingBatch',
        'chargeVersion',
        'chargeVersion.chargeElements',
        'chargeVersion.chargeElements.chargeCategory',
        'chargeVersion.chargeElements.chargePurposes',
        'chargeVersion.chargeElements.purposeUse',
        'chargeVersion.licence',
        'chargeVersion.licence.licenceAgreements',
        'chargeVersion.licence.licenceAgreements.financialAgreementType'
      ]);
    });

    test('returns the result of the helpers function', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.update', () => {
    const data = {
      status: 'complete'
    };
    const testId = 'test-id';
    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.update(testId, data);
    });

    test('calls model.forge with correct id', async () => {
      const [params] = BillingBatchChargeVersionYear.forge.lastCall.args;
      expect(params).to.equal({ billingBatchChargeVersionYearId: testId });
    });

    test('calls save() with the supplied data', async () => {
      const [params] = stub.save.lastCall.args;
      expect(params).to.equal(data);
    });
  });

  experiment('.findStatusCountsByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.findStatusCountsByBatchId(batchId);
    });

    test('calls raw.multiRow with correct query and params', async () => {
      const [query, params] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.findStatusCountsByBatchId);
      expect(params).to.equal({ batchId });
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId);
    });

    test('calls forge() on the model', async () => {
      expect(BillingBatchChargeVersionYear.forge.called).to.be.true();
    });

    test('calls where() with the correct params', async () => {
      const [params] = stub.where.lastCall.args;
      expect(params).to.equal({ billing_batch_id: batchId });
    });

    test('calls destroy() to delete found records', async () => {
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: true });
    });

    test('when deletion is not required, calls destroy() with the correct params', async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId, false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });

  experiment('.deleteByInvoiceId', () => {
    const billingInvoiceId = 'test-invoice-id';

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByInvoiceId(billingInvoiceId);
    });

    test('calls knex.raw with correct query and params', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByInvoiceId);
      expect(params).to.equal({ billingInvoiceId });
    });
  });

  experiment('.findByBatchId', () => {
    let result;
    const billingBatchId = 'test-batch-id';

    beforeEach(async () => {
      result = await repos.billingBatchChargeVersionYears.findByBatchId(billingBatchId);
    });

    test('calls helpers .findMany() with the model', async () => {
      const [model] = helpers.findMany.lastCall.args;
      expect(model).to.equal(BillingBatchChargeVersionYear);
    });

    test('passes the correct filter conditions', async () => {
      const [, conditions] = helpers.findMany.lastCall.args;
      expect(conditions).to.equal({ billing_batch_id: billingBatchId });
    });

    test('returns the result of the helpers function', async () => {
      expect(result).to.equal({ bar: 'baz' });
    });

    test('passes the correct with related array when include related is false', async () => {
      await repos.billingBatchChargeVersionYears.findByBatchId(billingBatchId, false);
      const [,, withRelated] = helpers.findMany.lastCall.args;
      expect(withRelated).to.equal([]);
    });

    test('passes the correct with related array when include related is true', async () => {
      await repos.billingBatchChargeVersionYears.findByBatchId(billingBatchId, true);
      const [,, withRelated] = helpers.findMany.lastCall.args;
      expect(withRelated).to.equal(['chargeVersion']);
    });
  });

  experiment('.findTwoPartTariffByBatchId', () => {
    let result;
    const billingBatchId = 'test-batch-id';

    beforeEach(async () => {
      result = await repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId(billingBatchId);
    });

    test('calls helpers .findMany() with the model', async () => {
      const [model] = helpers.findMany.lastCall.args;
      expect(model).to.equal(BillingBatchChargeVersionYear);
    });

    test('passes the correct filter conditions', async () => {
      const [, conditions] = helpers.findMany.lastCall.args;
      expect(conditions).to.equal({
        billing_batch_id: billingBatchId,
        transaction_type: TRANSACTION_TYPE.twoPartTariff
      });
    });

    test('returns the result of the helpers function', async () => {
      expect(result).to.equal({ bar: 'baz' });
    });
  });

  experiment('.deleteByBatchIdAndLicenceId', () => {
    const billingBatchId = 'test-batch-id';
    const licenceId = 'test-licence-id';

    test('calls knex raw method with correct query to delete 2PT transaction types only', async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId(billingBatchId, licenceId, true);
      expect(bookshelf.knex.raw.calledWith(
        queries.delete2PTByBatchIdAndLicenceId, { billingBatchId, licenceId }
      )).to.be.true();
    });

    test('calls knex raw method with correct query to delete 2PT transaction types only', async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId(billingBatchId, licenceId);
      expect(bookshelf.knex.raw.calledWith(
        queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId }
      )).to.be.true();
    });
  });

  experiment('.create', () => {
    const billingBatchId = 'test-batch-id';
    const chargeVersionId = 'test-charge-version-id';
    const financialYearEnding = 2020;
    const status = 'processing';
    const transactionType = 'annual';
    const isSummer = false;

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.create(
        { billingBatchId, chargeVersionId, financialYearEnding, status, transactionType, isSummer }
      );
    });

    test('calls model.forge with correct params', async () => {
      expect(BillingBatchChargeVersionYear.forge.calledWith({
        billingBatchId, chargeVersionId, financialYearEnding, status, transactionType, isSummer
      })).to.be.true();
    });

    test('calls .save on the model', async () => {
      expect(stub.save.called).to.be.true();
    });

    test('calls .toJSON on the model', async () => {
      expect(model.toJSON.called).to.be.true();
    });

    test('calls the methods in the correct order', async () => {
      sinon.assert.callOrder(
        BillingBatchChargeVersionYear.forge,
        stub.save,
        model.toJSON
      );
    });
  });

  experiment('.deleteByBatchIdAndLicenceIdAndFinancialYearEnding', () => {
    const batchId = 'test-batch-id';
    const licenceId = 'test-charge-version-id';
    const financialYearEnding = 2020;

    beforeEach(async () => {
      await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceIdAndFinancialYearEnding(
        batchId, licenceId, financialYearEnding
      );
    });

    test('calls knex.raw with correct params', async () => {
      expect(bookshelf.knex.raw.calledWith(queries.deleteByBatchIdAndLicenceIdAndFinancialYearEnding, {
        batchId,
        licenceId,
        financialYearEnding
      })).to.be.true();
    });
  });
});

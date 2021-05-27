const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const billingVolumes = require('../../../../src/lib/connectors/repos/billing-volumes');
const { BillingVolume, bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-volumes');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');

experiment('lib/connectors/repos/billing-volumes', () => {
  let stub, model;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      save: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      query: sandbox.stub().returnsThis(),
      fetch: sandbox.stub().resolves(model),
      fetchAll: sandbox.stub().resolves(model),
      destroy: sandbox.stub().resolves()
    };

    sandbox.stub(BillingVolume, 'forge').returns(stub);
    sandbox.stub(BillingVolume, 'where').returns(stub);

    sandbox.stub(bookshelf.knex, 'raw');
    sandbox.stub(raw, 'multiRow');
  });

  afterEach(async () => sandbox.restore());

  experiment('.create', () => {
    let result;

    const data = {
      chargeElementId: '82edd393-c53b-4ea9-bd51-f56cc065777e',
      financialYear: 2019,
      isSummer: false
    };

    beforeEach(async () => {
      result = await billingVolumes.create(data);
    });

    test('calls model.forge with correct data', async () => {
      const [params] = BillingVolume.forge.lastCall.args;
      expect(params).to.equal(data);
    });

    test('.save() on the model', async () => {
      expect(stub.save.called).to.be.true();
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findApprovedByChargeElementIdsAndFinancialYear', () => {
    let result;
    beforeEach(async () => {
      result = await billingVolumes.findApprovedByChargeElementIdsAndFinancialYear(['test-id-1', 'test-id-2'], 2020);
    });

    test('calls model.forge', async () => {
      expect(BillingVolume.forge.calledWith()).to.be.true();
    });

    test('finds rows with matching charge element IDs', async () => {
      expect(stub.query.calledWith(
        'whereIn', 'charge_element_id', ['test-id-1', 'test-id-2']
      )).to.be.true();
    });

    test('finds only approved rows with the supplied financial year ending', async () => {
      expect(stub.where.calledWith({
        financial_year: 2020,
        is_approved: true,
        errored_on: null
      })).to.be.true();
    });

    test('calls .fetchAll() to run the query', async () => {
      expect(stub.fetchAll.called).to.be.true();
    });

    test('calls .toJSON() on the resulting collection', async () => {
      expect(model.toJSON.called).to.be.true();
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.update', () => {
    let result;
    const id = 'test-id';
    const changes = {
      calculatedVolume: 43.2,
      twoPartTariffReview: { id: 1234, email: 'test@example.com' }
    };
    beforeEach(async () => {
      result = await billingVolumes.update(id, changes);
    });

    test('calls model.forge with correct data', () => {
      const [params] = BillingVolume.forge.lastCall.args;
      expect(params.billingVolumeId).to.equal(id);
    });

    test('calls save with correct data', () => {
      const [params] = stub.save.lastCall.args;
      expect(params).to.equal(changes);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.getUnapprovedVolumesForBatch', () => {
    let result;
    const id = 'test-id';
    beforeEach(async () => {
      result = await billingVolumes.getUnapprovedVolumesForBatch(id);
    });

    test('calls model.forge', () => {
      expect(BillingVolume.forge.called).to.be.true();
    });

    test('queries for unapproved volumes with matching batch id', async () => {
      const [filter] = stub.where.lastCall.args;
      expect(filter).to.equal({ billing_batch_id: 'test-id', is_approved: false, errored_on: null });
    });

    test('calls fetchAll', () => {
      expect(stub.fetchAll.called).to.be.true();
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findByBatchId', () => {
    const batchId = 'test-batch-id';
    beforeEach(async () => {
      await billingVolumes.findByBatchId(batchId);
    });

    test('calls model.forge()', () => {
      expect(BillingVolume.forge.called).to.be.true();
    });

    test('queries for volumes with matching batch id', async () => {
      const [filter] = stub.where.lastCall.args;
      expect(filter).to.equal({ billing_batch_id: 'test-batch-id' });
    });

    test('calls fetchAll() to find records', () => {
      expect(stub.fetchAll.called).to.be.true();
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';
    beforeEach(async () => {
      await billingVolumes.deleteByBatchId(batchId);
    });

    test('calls model.forge()', () => {
      expect(BillingVolume.forge.called).to.be.true();
    });

    test('queries for volumes with matching batch id', async () => {
      const [filter] = stub.where.lastCall.args;
      expect(filter).to.equal({ billing_batch_id: 'test-batch-id' });
    });

    test('calls destroy() with expected options', () => {
      expect(stub.destroy.calledWith(
        { require: false }
      )).to.be.true();
    });
  });

  experiment('.deleteByInvoiceLicenceAndBatchId', () => {
    const invoiceLicenceId = 'test-invoice-licence-id';
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await billingVolumes.deleteByInvoiceLicenceAndBatchId(invoiceLicenceId, batchId);
    });

    test('calls knex.raw() with correct argumements', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByInvoiceLicenceAndBatchId);
      expect(params).to.equal({ invoiceLicenceId, batchId });
    });
  });

  experiment('.deleteByBatchAndInvoiceId', () => {
    const batchId = 'test-batch-id';
    const billingInvoiceId = 'test-invoice-account-id';

    beforeEach(async () => {
      await billingVolumes.deleteByBatchAndInvoiceId(batchId, billingInvoiceId);
    });

    test('calls knex.raw() with correct argumements', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByBatchAndInvoiceId);
      expect(params).to.equal({ batchId, billingInvoiceId });
    });
  });

  experiment('.findByBatchIdAndLicenceId', () => {
    const billingBatchId = 'test-batch-id';
    const licenceId = 'test-invoice-account-id';

    beforeEach(async () => {
      await billingVolumes.findByBatchIdAndLicenceId(billingBatchId, licenceId);
    });

    test('calls raw.multiRow() with correct argumements', async () => {
      const [query, params] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.findByBatchIdAndLicenceId);
      expect(params).to.equal({ billingBatchId, licenceId });
    });
  });

  experiment('.findByIds', () => {
    beforeEach(async () => {
      billingVolumes.findByIds(['id-1', 'id-2']);
    });

    test('calls .where to find only the rows with the supplied IDs', async () => {
      expect(BillingVolume.where.calledWith(
        'billing_volume_id', 'in', ['id-1', 'id-2']
      )).to.be.true();
    });

    test('fetched related models', async () => {
      expect(stub.fetchAll.calledWith(
        {
          withRelated: [
            'chargeElement',
            'chargeElement.purposeUse'
          ]
        }
      )).to.be.true();
    });

    test('calls .toJSON on the collection', async () => {
      expect(model.toJSON.called).to.be.true();
    });
  });

  experiment('.deleteByBatchIdAndLicenceId', () => {
    const billingBatchId = 'test-batch-id';
    const licenceId = 'test-invoice-account-id';

    beforeEach(async () => {
      await billingVolumes.deleteByBatchIdAndLicenceId(billingBatchId, licenceId);
    });

    test('calls knex.raw with correct query and params', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByBatchIdAndLicenceId);
      expect(params).to.equal({ billingBatchId, licenceId });
    });
  });

  experiment('.updateByBatchId', () => {
    const changes = {
      twoPartTariffStatus: 20,
      twoPartTariffError: true
    };

    beforeEach(async () => {
      await billingVolumes.updateByBatchId('test-batch-id', changes);
    });

    test('calls .where to find only the rows in the relevant batch', async () => {
      expect(BillingVolume.where.calledWith(
        'billing_batch_id', 'test-batch-id'
      )).to.be.true();
    });

    test('saves the changes', async () => {
      expect(stub.save.calledWith(changes)).to.be.true();
    });

    test('passes in expected options', async () => {
      const [, options] = stub.save.lastCall.args;
      expect(options.method).to.equal('update');
      expect(options.require).to.be.false();
    });

    test('calls .toJSON on the collection', async () => {
      expect(model.toJSON.called).to.be.true();
    });
  });

  experiment('.markVolumesAsErrored', () => {
    beforeEach(async () => {
      await billingVolumes.markVolumesAsErrored('test-batch-id', { require: false });
    });

    test('calls .where to find only the rows in the relevant batch', async () => {
      expect(BillingVolume.where.calledWith(
        'billing_batch_id',
        'test-batch-id'
      )).to.be.true();
    });

    test('saves the changes', async () => {
      const [updates] = stub.save.lastCall.args;
      expect(Object.keys(updates)).to.only.include('errored_on');
      expect(updates.errored_on instanceof Date).to.be.true();
    });

    test('passes in expected options', async () => {
      const [, options] = stub.save.lastCall.args;
      expect(options.method).to.equal('update');
      expect(options.require).to.be.false();
    });

    test('calls .toJSON on the collection', async () => {
      expect(model.toJSON.called).to.be.true();
    });
  });

  experiment('.findByChargeVersionAndFinancialYear', () => {
    const chargeVersionId = 'test-charge-version-id';
    const financialYearEnding = 2022;

    beforeEach(async () => {
      await billingVolumes.findByChargeVersionAndFinancialYear(chargeVersionId, financialYearEnding);
    });

    test('calls raw.multiRow with the query and params', async () => {
      expect(raw.multiRow.calledWith(
        queries.findByChargeVersionAndFinancialYear, {
          chargeVersionId,
          financialYearEnding
        }
      ));
    });
  });
});

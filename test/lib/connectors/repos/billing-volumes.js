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
    sandbox.stub(bookshelf.knex, 'raw');
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

  experiment('.findByChargeElementIdsAndFinancialYear', () => {
    let result;
    const ids = ['charge-element-id-1', 'charge-element-id-2'];

    beforeEach(async () => {
      result = await billingVolumes.findByChargeElementIdsAndFinancialYear(ids, 2019);
    });

    test('calls model.forge', () => {
      expect(BillingVolume.forge.called).to.be.true();
    });

    test('queries for matching ID(s)', async () => {
      const [operator, field, values] = stub.query.lastCall.args;
      expect(operator).to.equal('whereIn');
      expect(field).to.equal('charge_element_id');
      expect(values).to.equal(['charge-element-id-1', 'charge-element-id-2']);
    });

    test('queries for matching financial year', async () => {
      const [filter] = stub.where.lastCall.args;
      expect(filter).to.equal({ financial_year: 2019 });
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
      expect(filter).to.equal({ billing_batch_id: 'test-id', is_approved: false });
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

    test('calls destroy() to delete records', () => {
      expect(stub.destroy.called).to.be.true();
    });
  });

  experiment('.deleteByInvoiceLicenceAndBatchId', async () => {
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

  experiment('.deleteByBatchAndInvoiceAccountId', async () => {
    const batchId = 'test-batch-id';
    const invoiceAccountId = 'test-invoice-account-id';

    beforeEach(async () => {
      await billingVolumes.deleteByBatchAndInvoiceAccountId(batchId, invoiceAccountId);
    });

    test('calls knex.raw() with correct argumements', async () => {
      const [query, params] = bookshelf.knex.raw.lastCall.args;
      expect(query).to.equal(queries.deleteByBatchAndInvoiceAccountId);
      expect(params).to.equal({ batchId, invoiceAccountId });
    });
  });
});

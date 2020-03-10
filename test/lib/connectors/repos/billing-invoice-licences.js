const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const billingInvoiceLicences = require('../../../../src/lib/connectors/repos/billing-invoice-licences');
const { bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-invoice-licences');

experiment('lib/connectors/repos/billing-invoice-licences', () => {
  beforeEach(async () => {
    sandbox.stub(bookshelf.knex, 'raw');
    sandbox.stub(raw, 'singleRow');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.upsert', () => {
    const data = {
      billingInvoiceId: '7d702412-46a4-4a88-bb59-cd770d3eaa3f',
      companyId: 'cfe824a3-2a5e-457e-82ae-bd4bcc43dbe3',
      addressId: 'f3597ab0-3e6f-4564-82a7-939aa2a7e5d6',
      licenceRef: '01/123/ABC'
    };

    beforeEach(async () => {
      await billingInvoiceLicences.upsert(data);
    });

    test('calls raw.singleRow with correct argumements', async () => {
      const { args } = raw.singleRow.lastCall;
      expect(args[0]).to.equal(queries.upsert);
      expect(args[1]).to.equal(data);
    });
  });

  experiment('.deleteEmptyByBatchId', () => {
    const batchId = '23181afd-25aa-4a8e-9342-7734dd844f7b';

    beforeEach(async () => {
      await billingInvoiceLicences.deleteEmptyByBatchId(batchId);
    });

    test('calls bookshelf.knex.raw with correct params', async () => {
      const { args } = bookshelf.knex.raw.lastCall;
      expect(args[0]).to.equal(queries.deleteEmptyByBatchId);
      expect(args[1]).to.equal({ batchId });
    });
  });

  experiment('.deleteByBatchAndInvoiceAccount', () => {
    let batchId;
    let invoiceAccountId;

    beforeEach(async () => {
      batchId = uuid();
      invoiceAccountId = uuid();
      await billingInvoiceLicences.deleteByBatchAndInvoiceAccount(batchId, invoiceAccountId);
    });

    test('calls bookshelf.knex.raw with correct params', async () => {
      const { args } = bookshelf.knex.raw.lastCall;
      expect(args[0]).to.equal(queries.deleteByBatchAndInvoiceAccount);
      expect(args[1]).to.equal({ batchId, invoiceAccountId });
    });
  });
});

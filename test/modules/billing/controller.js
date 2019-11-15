const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const repos = require('../../../src/lib/connectors/repository');
const event = require('../../../src/lib/event');

const controller = require('../../../src/modules/billing/controller');

experiment('modules/billing/controller', () => {
  let h, hapiResponseStub;

  beforeEach(async () => {
    hapiResponseStub = {
      code: sandbox.stub().returnsThis()
    };

    h = {
      response: sandbox.stub().returns(hapiResponseStub)
    };

    sandbox.stub(repos.billingBatches, 'createBatch').resolves({
      rows: [
        {
          batch_type: 'annual',
          billing_batch_id: '00000000-0000-0000-0000-000000000000'
        }
      ]
    });

    sandbox.stub(repos.billingBatches, 'getById');
    sandbox.stub(repos.billingInvoices, 'findByBatchId');
    sandbox.stub(repos.billingInvoices, 'getInvoiceDetail');

    sandbox.stub(event, 'save').resolves({
      rows: [
        { event_id: '11111111-1111-1111-1111-111111111111' }
      ]
    });

    // sandbox.stub(populateBillingBatchJob, 'publish').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.postCreateBatch', () => {
    let request;

    beforeEach(async () => {
      request = {
        payload: {
          userEmail: 'test@example.com',
          regionId: '22222222-2222-2222-2222-222222222222',
          batchType: 'annual',
          financialYear: 2019,
          season: 'summer'
        },
        messageQueue: {
          publish: sandbox.stub().resolves()
        }
      };

      await controller.postCreateBatch(request, h);
    });

    test('creates a new entry in the billing_batches table', async () => {
      expect(repos.billingBatches.createBatch.calledWith(
        request.payload.regionId,
        request.payload.batchType,
        request.payload.financialYear,
        request.payload.financialYear,
        request.payload.season
      )).to.be.true();
    });

    test('creates a new entry with the expected range for a supplementary bill run', async () => {
      sandbox.resetHistory();
      request.payload.batchType = 'supplementary';
      await controller.postCreateBatch(request, h);

      expect(repos.billingBatches.createBatch.calledWith(
        request.payload.regionId,
        request.payload.batchType,
        2013,
        2019,
        request.payload.season
      )).to.be.true();
    });

    test('creates a new event with the created batch', async () => {
      const [savedEvent] = event.save.lastCall.args;
      expect(savedEvent.type).to.equal('billing-batch');
      expect(savedEvent.subtype).to.equal(request.payload.batchType);
      expect(savedEvent.issuer).to.equal(request.payload.userEmail);
      expect(savedEvent.metadata.batch.billing_batch_id).to.equal('00000000-0000-0000-0000-000000000000');
      expect(savedEvent.status).to.equal('received');
    });

    test('publishes a new job to the message queue with the event id', async () => {
      const [{ data: { eventId } }] = request.messageQueue.publish.lastCall.args;
      expect(eventId).to.equal('11111111-1111-1111-1111-111111111111');
    });

    test('the response contains the event', async () => {
      const [{ data }] = h.response.lastCall.args;
      expect(data.event.event_id).to.equal('11111111-1111-1111-1111-111111111111');
    });

    test('the response contains a URL to the event', async () => {
      const [{ data }] = h.response.lastCall.args;
      expect(data.url).to.equal('/water/1.0/event/11111111-1111-1111-1111-111111111111');
    });

    test('a 202 response code is used', async () => {
      const [code] = hapiResponseStub.code.lastCall.args;
      expect(code).to.equal(202);
    });
  });

  experiment('.getBatch', () => {
    experiment('when the batch is found', () => {
      let response;

      beforeEach(async () => {
        repos.billingBatches.getById.resolves({
          billing_batch_id: 'test-batch-id',
          region_id: 'test-region-id',
          batch_type: 'annual'
        });

        response = await controller.getBatch({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('a camel case representation of the batch is returned', async () => {
        expect(response.data).to.equal({
          billingBatchId: 'test-batch-id',
          regionId: 'test-region-id',
          batchType: 'annual'
        });
      });

      test('the error object is null', async () => {
        expect(response.error).to.be.null();
      });
    });

    experiment('when the batch is not found', () => {
      let response;

      beforeEach(async () => {
        repos.billingBatches.getById.resolves(null);
        response = await controller.getBatch({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the data object is null', async () => {
        expect(response.data).to.be.null();
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No batch found with id: test-batch-id');
      });
    });
  });

  experiment('.getBatchInvoices', () => {
    experiment('when the batch is found', () => {
      let response;

      beforeEach(async () => {
        repos.billingInvoices.findByBatchId.resolves([
          {
            billing_invoice_id: 'test-invoice-id',
            invoice_account_id: 'test-account-id',
            address: {
              test: 1,
              testing: 'one'
            },
            invoice_account_number: '11222',
            net_amount: '192',
            is_credit: true,
            date_created: '2019-11-11T16:05:07.330Z',
            date_updated: '2019-11-11T16:05:07.330Z'
          }
        ]);

        response = await controller.getBatchInvoices({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('a camel case representation of the data is returned', async () => {
        expect(response.data).to.equal([
          {
            billingInvoiceId: 'test-invoice-id',
            invoiceAccountId: 'test-account-id',
            address: {
              test: 1,
              testing: 'one'
            },
            invoiceAccountNumber: '11222',
            netAmount: '192',
            isCredit: true,
            dateCreated: '2019-11-11T16:05:07.330Z',
            dateUpdated: '2019-11-11T16:05:07.330Z'
          }
        ]);
      });

      test('the error object is null', async () => {
        expect(response.error).to.be.null();
      });
    });

    experiment('when the batch does not exist', () => {
      let response;

      beforeEach(async () => {
        repos.billingInvoices.findByBatchId.resolves([]);
        response = await controller.getBatchInvoices({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the data object is null', async () => {
        expect(response.data).to.be.null();
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No invoices found for batch with id: test-batch-id');
      });
    });
  });

  experiment('.getInvoiceDetail', () => {
    experiment('when the invoice is found', () => {
      let response;

      beforeEach(async () => {
        repos.billingInvoices.getInvoiceDetail.resolves({
          billing_invoice_id: 'test-invoice-id'
        });

        response = await controller.getInvoiceDetail({
          params: {
            invoiceId: 'test-invoice-id'
          }
        });
      });

      test('a camel case representation of the invoice is returned', async () => {
        expect(response.data).to.equal({
          billingInvoiceId: 'test-invoice-id'
        });
      });

      test('the error object is null', async () => {
        expect(response.error).to.be.null();
      });
    });

    experiment('when the invoice is not found', () => {
      let response;

      beforeEach(async () => {
        repos.billingInvoices.getInvoiceDetail.resolves(null);
        response = await controller.getInvoiceDetail({
          params: {
            invoiceId: 'test-invoice-id'
          }
        });
      });

      test('the data object is null', async () => {
        expect(response.data).to.be.null();
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No invoice found with id: test-invoice-id');
      });
    });
  });
});

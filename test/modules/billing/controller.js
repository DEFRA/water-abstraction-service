'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const config = require('../../../config');
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const Invoice = require('../../../src/lib/models/invoice');

const repos = require('../../../src/lib/connectors/repository');
const event = require('../../../src/lib/event');
const invoiceService = require('../../../src/modules/billing/services/invoice-service');
const batchService = require('../../../src/modules/billing/services/batch-service');
const eventService = require('../../../src/modules/billing/services/event-service');
const { jobStatus } = require('../../../src/modules/billing/lib/batch');
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
      batch_type: 'annual',
      billing_batch_id: '00000000-0000-0000-0000-000000000000'
    });

    sandbox.stub(repos.billingBatches, 'getById').resolves();

    sandbox.stub(batchService, 'getBatches').resolves();
    sandbox.stub(batchService, 'deleteBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoiceForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatch').resolves();
    sandbox.stub(eventService, 'getEventForBatch').resolves();

    sandbox.stub(event, 'save').resolves({
      rows: [
        { event_id: '11111111-1111-1111-1111-111111111111' }
      ]
    });

    sandbox.stub(event, 'updateStatus').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.postCreateBatch for annual billing', () => {
    let request;

    beforeEach(async () => {
      request = {
        payload: {
          userEmail: 'test@example.com',
          regionId: '22222222-2222-2222-2222-222222222222',
          batchType: 'annual',
          financialYearEnding: 2019,
          season: 'summer'
        },
        messageQueue: {
          publish: sandbox.stub().resolves()
        }
      };
    });

    experiment('if there is a batch being processed for the region', () => {
      beforeEach(async () => {
        repos.billingBatches.createBatch.resolves(null);
        await controller.postCreateBatch(request, h);
      });

      test('an attempt to create the batch is made', async () => {
        expect(repos.billingBatches.createBatch.calledWith(
          request.payload.regionId,
          request.payload.batchType,
          request.payload.financialYearEnding,
          request.payload.financialYearEnding,
          request.payload.season
        )).to.be.true();
      });

      test('no event is created', async () => {
        expect(event.save.called).to.be.false();
      });

      test('no job is published', async () => {
        expect(request.messageQueue.publish.called).to.be.false();
      });

      test('the response contains an error message', async () => {
        const [{ error }] = h.response.lastCall.args;
        expect(error).to.equal('Batch already processing for region 22222222-2222-2222-2222-222222222222');
      });

      test('a 409 response code is used', async () => {
        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(409);
      });
    });

    experiment('if there is not a batch already being processed for the region', () => {
      beforeEach(async () => {
        await controller.postCreateBatch(request, h);
      });

      test('creates a new entry in the billing_batches table', async () => {
        expect(repos.billingBatches.createBatch.calledWith(
          request.payload.regionId,
          request.payload.batchType,
          request.payload.financialYearEnding,
          request.payload.financialYearEnding,
          request.payload.season
        )).to.be.true();
      });

      test('creates a new event with the created batch', async () => {
        const [savedEvent] = event.save.lastCall.args;
        expect(savedEvent.type).to.equal('billing-batch');
        expect(savedEvent.subtype).to.equal(request.payload.batchType);
        expect(savedEvent.issuer).to.equal(request.payload.userEmail);
        expect(savedEvent.metadata.batch.billing_batch_id).to.equal('00000000-0000-0000-0000-000000000000');
        expect(savedEvent.status).to.equal('start');
      });

      test('publishes a new job to the message queue with the event id', async () => {
        const [message] = request.messageQueue.publish.lastCall.args;
        expect(message.data.eventId).to.equal('11111111-1111-1111-1111-111111111111');
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
  });

  experiment('.postCreateBatch for supplementary billing', () => {
    let request;

    const years = 3;

    beforeEach(async () => {
      sandbox.stub(config.billing, 'supplementaryYears').value(years);

      request = {
        payload: {
          userEmail: 'test@example.com',
          regionId: '22222222-2222-2222-2222-222222222222',
          batchType: 'supplementary',
          financialYearEnding: 2019,
          season: 'summer'
        },
        messageQueue: {
          publish: sandbox.stub().resolves()
        }
      };

      await controller.postCreateBatch(request, h);
    });

    test('re-runs billing over a time period specified in the config', async () => {
      expect(repos.billingBatches.createBatch.calledWith(
        request.payload.regionId,
        request.payload.batchType,
        request.payload.financialYearEnding - years,
        request.payload.financialYearEnding,
        request.payload.season
      )).to.be.true();
    });
  });

  experiment('.getBatch', () => {
    experiment('when the batch is found', () => {
      let response;

      beforeEach(async () => {
        const request = {
          params: {
            batchId: 'test-batch-id'
          },
          pre: {
            batch: {
              billing_batch_id: 'test-batch-id',
              region_id: 'test-region-id',
              batch_type: 'annual'
            }
          }
        };

        response = await controller.getBatch(request);
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
  });

  experiment('.getBatches', () => {
    test('passes pagination options to the batch service', async () => {
      const request = {
        query: {
          page: 5,
          perPage: 10
        }

      };
      await controller.getBatches(request);

      const [page, perPage] = batchService.getBatches.lastCall.args;
      expect(page).to.equal(5);
      expect(perPage).to.equal(10);
    });

    test('directly returns the response from the batchService', async () => {
      const request = { query: {} };
      const batchResponse = {
        data: [],
        pagination: {}
      };
      batchService.getBatches.resolves(batchResponse);

      const response = await controller.getBatches(request);

      expect(response).to.equal(batchResponse);
    });
  });

  experiment('.getBatchInvoices', () => {
    experiment('when the batch is found', () => {
      let response;

      beforeEach(async () => {
        invoiceService.getInvoicesForBatch.resolves([
          new Invoice(),
          new Invoice()
        ]);

        response = await controller.getBatchInvoices({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the batch id is passed to the invoice service', async () => {
        const [batchId] = invoiceService.getInvoicesForBatch.lastCall.args;
        expect(batchId).to.equal('test-batch-id');
      });

      test('the error object is null', async () => {
        expect(response.error).to.be.null();
      });
    });
  });

  experiment('.getBatchInvoiceDetail', () => {
    experiment('when the invoice is found', () => {
      let response;
      let invoice;

      beforeEach(async () => {
        invoice = new Invoice(uuid());
        invoiceService.getInvoiceForBatch.resolves(invoice);

        response = await controller.getBatchInvoiceDetail({
          params: {
            batchId: 'test-batch-id',
            invoiceId: 'test-invoice-id'
          }
        });
      });

      test('the invoice is returned', async () => {
        expect(response.data.id).to.equal(invoice.id);
      });

      test('the error object is null', async () => {
        expect(response.error).to.be.null();
      });
    });

    experiment('when the invoice is not found', () => {
      let response;

      beforeEach(async () => {
        invoiceService.getInvoiceForBatch.resolves();
        response = await controller.getBatchInvoiceDetail({
          params: {
            batchId: 'test-batch-id',
            invoiceId: 'test-invoice-id'
          }
        });
      });

      test('the data object is null', async () => {
        expect(response.data).to.be.null();
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No invoice found with id: test-invoice-id in batch with id: test-batch-id');
      });
    });
  });

  experiment('.deleteAccountFromBatch', () => {
    test('returns a 404 if there are no invoices for the invoice account id', async () => {
      const request = {
        params: {
          batchId: 'test-batch-id',
          accountId: 'test-account-id'
        },
        pre: {
          batch: {
            status: 'review'
          }
        }
      };

      const invoices = [{
        invoiceLicences: [
          { transactions: [] }
        ],
        invoiceAccount: {
          id: 'not-test-account-id',
          accountNumber: 'A88888888A'
        }
      }];

      invoiceService.getInvoicesForBatch.resolves(invoices);

      const response = await controller.deleteAccountFromBatch(request);
      expect(invoiceService.getInvoicesForBatch.calledWith('test-batch-id')).to.be.true();
      expect(response.output.payload.statusCode).to.equal(404);
      expect(response.output.payload.message).to.equal('No invoices for account (test-account-id) in batch (test-batch-id)');
    });
  });

  experiment('.deleteBatch', () => {
    let request;

    beforeEach(async () => {
      eventService.getEventForBatch.resolves({
        event_id: 'test-event-id'
      });

      request = {
        pre: {
          batch: {
            billing_batch_id: 'test-batch-id'
          }
        }
      };

      await controller.deleteBatch(request, h);
    });

    test('deletes the batch via the batch service', async () => {
      expect(batchService.deleteBatch.calledWith('test-batch-id')).to.be.true();
    });

    test('loads the batch event', async () => {
      expect(eventService.getEventForBatch.calledWith('test-batch-id')).to.be.true();
    });

    test('sets the event status to deleted', async () => {
      expect(event.updateStatus.calledWith(
        'test-event-id',
        jobStatus.deleted
      )).to.be.true();
    });

    test('returns a 204 response', async () => {
      const [code] = hapiResponseStub.code.lastCall.args;
      expect(code).to.equal(204);
    });
  });
});

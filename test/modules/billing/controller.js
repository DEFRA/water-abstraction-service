'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const config = require('../../../config');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Invoice = require('../../../src/lib/models/invoice');
const Batch = require('../../../src/lib/models/batch');

const newRepos = require('../../../src/lib/connectors/repos');
const repos = require('../../../src/lib/connectors/repository');
const eventService = require('../../../src/lib/services/events');
const invoiceService = require('../../../src/modules/billing/services/invoice-service');
const batchService = require('../../../src/modules/billing/services/batch-service');
const controller = require('../../../src/modules/billing/controller');

const mappers = require('../../../src/modules/billing/mappers');

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

    sandbox.stub(newRepos.billingBatches, 'findOne').resolves();
    sandbox.stub(batchService, 'getBatches').resolves();
    sandbox.stub(batchService, 'deleteBatch').resolves();
    sandbox.stub(batchService, 'approveBatch').resolves();
    sandbox.stub(batchService, 'decorateBatchWithTotals').resolves();
    sandbox.stub(batchService, 'getMostRecentLiveBatchByRegion').resolves();
    sandbox.stub(batchService, 'deleteAccountFromBatch').resolves();

    sandbox.stub(invoiceService, 'getInvoiceForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesTransactionsForBatch').resolves();

    sandbox.stub(eventService, 'create').resolves({
      id: '11111111-1111-1111-1111-111111111111'
    });

    sandbox.stub(mappers.api.invoice, 'modelToBatchInvoices');
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

        batchService.getMostRecentLiveBatchByRegion.resolves({
          id: 'test-batch-id'
        });
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
        expect(eventService.create.called).to.be.false();
      });

      test('no job is published', async () => {
        expect(request.messageQueue.publish.called).to.be.false();
      });

      test('the response contains an error message', async () => {
        const [{ message }] = h.response.lastCall.args;
        expect(message).to.equal('Batch already live for region 22222222-2222-2222-2222-222222222222');
      });

      test('the response contains the currently live batch', async () => {
        const [{ existingBatch }] = h.response.lastCall.args;
        expect(existingBatch).to.equal({ id: 'test-batch-id' });
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
        const [savedEvent] = eventService.create.lastCall.args;
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
        expect(data.event.id).to.equal('11111111-1111-1111-1111-111111111111');
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
      let response, request;

      beforeEach(async () => {
        request = {
          params: {
            batchId: 'test-batch-id'
          },
          query: {
            totals: false
          },
          pre: {
            batch: new Batch('00000000-0000-0000-0000-000000000000')
          }
        };
      });

      experiment('when totals query param is false', () => {
        beforeEach(async () => {
          response = await controller.getBatch(request);
        });

        test('the batch is returned', async () => {
          expect(response).to.equal(request.pre.batch);
        });

        test('the batch is not decorated with totals', async () => {
          expect(batchService.decorateBatchWithTotals.called).to.be.false();
        });
      });

      experiment('when the totals are requested', () => {
        beforeEach(async () => {
          request.query.totals = true;
          response = await controller.getBatch(request);
        });

        test('the batch is decorated with totals', async () => {
          expect(batchService.decorateBatchWithTotals.calledWith(
            request.pre.batch
          )).to.be.true();
        });
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
      let invoices;

      beforeEach(async () => {
        invoices = [
          new Invoice(),
          new Invoice()
        ];

        invoiceService.getInvoicesForBatch.resolves(invoices);

        await controller.getBatchInvoices({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the batch id is passed to the invoice service', async () => {
        const [batchId] = invoiceService.getInvoicesForBatch.lastCall.args;
        expect(batchId).to.equal('test-batch-id');
      });

      test('the response is mapped using the appropriate mapper', async () => {
        expect(mappers.api.invoice.modelToBatchInvoices.callCount).to.equal(2);
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[0])).to.be.true();
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[1])).to.be.true();
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
        expect(response.id).to.equal(invoice.id);
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

  experiment('.getBatchInvoicesDetails', () => {
    experiment('when the invoice is found', () => {
      let response;
      let invoices;

      beforeEach(async () => {
        const invoice = new Invoice(uuid());
        invoices = [invoice, invoice];

        invoiceService.getInvoicesTransactionsForBatch.resolves(invoices);

        response = await controller.getBatchInvoicesDetails({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the invoice is returned', async () => {
        expect(response[0].id).to.equal(invoices[0].id);
      });
    });

    experiment('when the batch is not found', () => {
      let response;

      beforeEach(async () => {
        invoiceService.getInvoicesTransactionsForBatch.resolves();
        response = await controller.getBatchInvoicesDetails({
          params: {
            batchId: 'test-batch-id'
          }
        });
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No invoices found in batch with id: test-batch-id');
      });
    });
  });

  experiment('.deleteAccountFromBatch', () => {
    let batch;
    let request;
    let invoices;

    beforeEach(async () => {
      batch = new Batch(uuid());
      request = {
        params: { batchId: batch.id, accountId: 'test-account-id' },
        pre: { batch }
      };

      invoices = [{
        invoiceLicences: [
          { transactions: [] }
        ],
        invoiceAccount: {
          id: 'not-test-account-id',
          accountNumber: 'A88888888A'
        }
      }];

      invoiceService.getInvoicesForBatch.resolves(invoices);
    });

    experiment('when accounts cannot be deleted from the batch', () => {
      const invalidStatuses = [
        Batch.BATCH_STATUS.processing,
        Batch.BATCH_STATUS.error,
        Batch.BATCH_STATUS.sent
      ];

      invalidStatuses.forEach(status => {
        test(`a 422 is returned for the ${status} status`, async () => {
          batch.status = status;

          await controller.deleteAccountFromBatch(request, h);

          expect(batchService.deleteAccountFromBatch.called).to.equal(false);
          expect(hapiResponseStub.code.calledWith(422)).to.be.true();

          const [message] = h.response.lastCall.args;

          expect(message).to.equal(`Cannot delete account from batch when status is ${status}`);
        });
      });
    });

    experiment('when accounts can be deleted from the batch', () => {
      const validStatuses = [
        Batch.BATCH_STATUS.ready,
        Batch.BATCH_STATUS.review
      ];

      validStatuses.forEach(status => {
        test(`the account is deleted for the ${status} status`, async () => {
          batch.status = status;
          invoices[0].invoiceAccount.id = 'test-account-id';
          await controller.deleteAccountFromBatch(request, h);

          const [batchArg, accountId] = batchService.deleteAccountFromBatch.lastCall.args;

          expect(batchArg.id).to.equal(batch.id);
          expect(accountId).to.equal('test-account-id');
        });
      });
    });

    test('returns a 404 if there are no invoices for the invoice account id', async () => {
      batch.status = Batch.BATCH_STATUS.ready;
      const response = await controller.deleteAccountFromBatch(request);
      expect(invoiceService.getInvoicesForBatch.calledWith(batch.id)).to.be.true();
      expect(response.output.payload.statusCode).to.equal(404);
      expect(response.output.payload.message).to.equal(`No invoices for account (test-account-id) in batch (${batch.id})`);
    });
  });

  experiment('.deleteBatch', () => {
    let request;
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      internalCallingUser = {
        email: 'test@example.com',
        id: 1234
      };

      batch = new Batch(uuid());

      request = {
        defra: { internalCallingUser },
        pre: { batch }
      };
    });

    experiment('for a batch that is processing', () => {
      test('a 422 is returned because the batch cannot be deleted yet', async () => {
        batch.status = Batch.BATCH_STATUS.processing;

        await controller.deleteBatch(request, h);

        expect(batchService.deleteBatch.called).to.equal(false);
        expect(hapiResponseStub.code.calledWith(422)).to.be.true();

        const [message] = h.response.lastCall.args;

        expect(message).to.equal('Cannot delete batch when status is processing');
      });
    });

    experiment('for a batch that is sent', () => {
      test('a 422 is returned because the batch cannot be deleted', async () => {
        batch.status = Batch.BATCH_STATUS.sent;

        await controller.deleteBatch(request, h);

        expect(batchService.deleteBatch.called).to.equal(false);
        expect(hapiResponseStub.code.calledWith(422)).to.be.true();

        const [message] = h.response.lastCall.args;

        expect(message).to.equal('Cannot delete batch when status is sent');
      });
    });

    experiment('for a batch that is in revew', () => {
      test('deletes the batch via the batch service', async () => {
        batch.status = Batch.BATCH_STATUS.review;
        await controller.deleteBatch(request, h);
        expect(batchService.deleteBatch.calledWith(batch, internalCallingUser)).to.be.true();
      });

      test('returns a 204 response', async () => {
        batch.status = Batch.BATCH_STATUS.review;
        await controller.deleteBatch(request, h);

        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(204);
      });
    });

    experiment('for a batch that is ready', () => {
      test('deletes the batch via the batch service', async () => {
        batch.status = Batch.BATCH_STATUS.ready;
        await controller.deleteBatch(request, h);
        expect(batchService.deleteBatch.calledWith(batch, internalCallingUser)).to.be.true();
      });

      test('returns a 204 response', async () => {
        batch.status = Batch.BATCH_STATUS.ready;
        await controller.deleteBatch(request, h);

        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(204);
      });
    });

    experiment('for a batch that has errored', () => {
      test('deletes the batch via the batch service', async () => {
        batch.status = Batch.BATCH_STATUS.error;
        await controller.deleteBatch(request, h);
        expect(batchService.deleteBatch.calledWith(batch, internalCallingUser)).to.be.true();
      });

      test('returns a 204 response', async () => {
        batch.status = Batch.BATCH_STATUS.error;
        await controller.deleteBatch(request, h);

        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(204);
      });
    });

    test('returns the error from the service if it fails', async () => {
      const err = new Error('whoops');
      batchService.deleteBatch.rejects(err);

      batch.status = Batch.BATCH_STATUS.error;

      const error = await expect(controller.deleteBatch(request, h)).to.reject();
      expect(error).to.equal(err);
    });
  });

  experiment('.postApproveBatch', () => {
    let request;
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      internalCallingUser = {
        email: 'test@example.com',
        id: 1234
      };

      batch = {
        billingBatchId: 'test-batch-id'
      };

      request = {
        defra: {
          internalCallingUser
        },
        pre: {
          batch
        }
      };

      await controller.postApproveBatch(request, h);
    });

    test('approves the batch via the batch service', async () => {
      expect(batchService.approveBatch.calledWith(batch, internalCallingUser)).to.be.true();
    });

    test('returns the approved batch', async () => {
      const approvedBatch = {
        billingBatchId: 'test-batch-id',
        status: 'sent'
      };
      batchService.approveBatch.resolves(approvedBatch);

      const result = await controller.postApproveBatch(request, h);

      expect(result).to.equal(approvedBatch);
    });

    test('returns the error from the service if it fails', async () => {
      const err = new Error('whoops');
      batchService.approveBatch.rejects(err);

      const result = await controller.postApproveBatch(request, h);
      expect(result).to.equal(err);
    });
  });
});

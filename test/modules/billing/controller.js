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
const { BATCH_STATUS, BATCH_TYPE } = Batch;

const newRepos = require('../../../src/lib/connectors/repos');
const eventService = require('../../../src/lib/services/events');
const invoiceService = require('../../../src/modules/billing/services/invoice-service');
const invoiceLicenceService = require('../../../src/modules/billing/services/invoice-licences-service');
const batchService = require('../../../src/modules/billing/services/batch-service');
const transactionsService = require('../../../src/modules/billing/services/transactions-service');
const billingVolumesService = require('../../../src/modules/billing/services/billing-volumes-service');
const controller = require('../../../src/modules/billing/controller');
const mappers = require('../../../src/modules/billing/mappers');
const { createBatch, createTransaction, createInvoice, createInvoiceLicence, createFinancialYear, createBillingVolume } = require('./test-data/test-billing-data');

const { NotFoundError } = require('../../../src/lib/errors');
const { BatchStatusError } = require('../../../src/modules/billing/lib/errors');

experiment('modules/billing/controller', () => {
  let h, hapiResponseStub, batch, tptBatch, transaction, billingVolume, processingBatch;

  beforeEach(async () => {
    hapiResponseStub = {
      code: sandbox.stub().returnsThis()
    };

    h = {
      response: sandbox.stub().returns(hapiResponseStub)
    };

    batch = new Batch('00000000-0000-0000-0000-000000000000');
    batch.type = 'annual';

    transaction = createTransaction();
    billingVolume = createBillingVolume();
    const invoice = createInvoice({}, [createInvoiceLicence({ transactions: [transaction] })]);
    tptBatch = createBatch({
      type: BATCH_TYPE.twoPartTariff,
      status: BATCH_STATUS.review,
      endYear: createFinancialYear(2018),
      isSummer: true
    }, invoice);

    processingBatch = createBatch({
      id: '33333333-3333-3333-3333-333333333333',
      type: BATCH_TYPE.twoPartTariff,
      status: BATCH_STATUS.processing
    });

    sandbox.stub(newRepos.billingBatches, 'findOne').resolves();

    sandbox.stub(batchService, 'create').resolves(batch);
    sandbox.stub(batchService, 'getBatches').resolves();
    sandbox.stub(batchService, 'deleteBatch').resolves();
    sandbox.stub(batchService, 'approveBatch').resolves();
    sandbox.stub(batchService, 'decorateBatchWithTotals').resolves();
    sandbox.stub(batchService, 'getMostRecentLiveBatchByRegion').resolves();
    sandbox.stub(batchService, 'approveTptBatchReview').resolves(processingBatch);
    sandbox.stub(batchService, 'deleteBatchInvoice').resolves();

    sandbox.stub(invoiceService, 'getInvoiceForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesTransactionsForBatch').resolves();

    sandbox.stub(invoiceLicenceService, 'getInvoiceLicenceWithTransactions').resolves();

    sandbox.stub(transactionsService, 'getById').resolves(tptBatch);
    sandbox.stub(billingVolumesService, 'updateBillingVolume').resolves(billingVolume);
    sandbox.stub(billingVolumesService, 'approveVolumesForBatch');

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
          isSummer: true
        },
        messageQueue: {
          publish: sandbox.stub().resolves()
        }
      };
    });

    experiment('if there is a batch being processed for the region', () => {
      beforeEach(async () => {
        const err = new Error('Batch already live for region 22222222-2222-2222-2222-222222222222');
        err.existingBatch = { id: 'test-batch-id' };
        batchService.create.rejects(err);
        await controller.postCreateBatch(request, h);
      });

      test('an attempt to create the batch is made', async () => {
        expect(batchService.create.calledWith(
          request.payload.regionId,
          request.payload.batchType,
          request.payload.financialYearEnding,
          request.payload.isSummer
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

    experiment('if some other error occurs', () => {
      beforeEach(async () => {
        batchService.create.rejects();
      });

      test('the handler throws the error', async () => {
        const func = () => controller.postCreateBatch(request, h);
        expect(func()).to.reject();
      });
    });

    experiment('if there is not a batch already being processed for the region', () => {
      beforeEach(async () => {
        await controller.postCreateBatch(request, h);
      });

      test('creates a new batch', async () => {
        expect(batchService.create.calledWith(
          request.payload.regionId,
          request.payload.batchType,
          request.payload.financialYearEnding,
          request.payload.isSummer
        )).to.be.true();
      });

      test('creates a new event with the created batch', async () => {
        const [savedEvent] = eventService.create.lastCall.args;
        expect(savedEvent.type).to.equal('billing-batch');
        expect(savedEvent.subtype).to.equal(request.payload.batchType);
        expect(savedEvent.issuer).to.equal(request.payload.userEmail);
        expect(savedEvent.metadata.batch.id).to.equal('00000000-0000-0000-0000-000000000000');
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

      test('the response contains the batch', async () => {
        const [{ data }] = h.response.lastCall.args;
        expect(data.batch).to.equal(batch);
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
          isSummer: true
        },
        messageQueue: {
          publish: sandbox.stub().resolves()
        }
      };

      await controller.postCreateBatch(request, h);
    });

    test('supplies the correct batch type the batch service', async () => {
      expect(batchService.create.calledWith(
        request.payload.regionId,
        request.payload.batchType,
        request.payload.financialYearEnding,
        request.payload.isSummer
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
    let request, response;

    beforeEach(async () => {
      request = {
        pre: {
          batch: {
            id: 'test-batch-id'
          }
        }
      };
    });

    experiment('when the batch is found', () => {
      let invoices;

      beforeEach(async () => {
        invoices = [
          new Invoice(),
          new Invoice()
        ];

        invoiceService.getInvoicesForBatch.resolves(invoices);

        await controller.getBatchInvoices(request);
      });

      test('the batch id is passed to the invoice service', async () => {
        const [batch, includeTransactions] = invoiceService.getInvoicesForBatch.lastCall.args;
        expect(batch).to.equal(request.pre.batch);
        expect(includeTransactions).to.equal(true);
      });

      test('the response is mapped using the appropriate mapper', async () => {
        expect(mappers.api.invoice.modelToBatchInvoices.callCount).to.equal(2);
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[0])).to.be.true();
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[1])).to.be.true();
      });
    });

    experiment('when the batch is not found', async () => {
      beforeEach(async () => {
        invoiceService.getInvoicesForBatch.rejects(new NotFoundError());
        response = await controller.getBatchInvoices(request);
      });

      test('returns a Boom not found error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.getBatchInvoiceDetail', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id',
          invoiceId: 'test-invoice-id'
        },
        pre: {
          batch: {
            id: 'test-batch-id'
          }
        }
      };
    });

    experiment('when the invoice is found', () => {
      let response;
      let invoice;

      beforeEach(async () => {
        invoice = new Invoice(uuid());
        invoiceService.getInvoiceForBatch.resolves(invoice);

        response = await controller.getBatchInvoiceDetail(request);
      });

      test('the invoice is returned', async () => {
        expect(response.id).to.equal(invoice.id);
      });
    });

    experiment('when the invoice is not found', () => {
      let response;

      beforeEach(async () => {
        invoiceService.getInvoiceForBatch.resolves();
        response = await controller.getBatchInvoiceDetail(request);
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
    let request;

    beforeEach(async () => {
      request = {
        params: {
          batchId: 'test-batch-id',
          invoiceId: 'test-invoice-id'
        },
        pre: {
          batch: {
            id: 'test-batch-id'
          }
        }
      };
    });

    experiment('when the invoice is found', () => {
      let response;
      let invoices;

      beforeEach(async () => {
        const invoice = new Invoice(uuid());
        invoices = [invoice, invoice];

        invoiceService.getInvoicesTransactionsForBatch.resolves(invoices);

        response = await controller.getBatchInvoicesDetails(request);
      });

      test('the invoice is returned', async () => {
        expect(response[0].id).to.equal(invoices[0].id);
      });
    });

    experiment('when the batch is not found', () => {
      let response;

      beforeEach(async () => {
        invoiceService.getInvoicesTransactionsForBatch.resolves();
        response = await controller.getBatchInvoicesDetails(request);
      });

      test('the error contains a not found message', async () => {
        expect(response.output.payload.message).to.equal('No invoices found in batch with id: test-batch-id');
      });
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

    experiment('for a batch that is in review', () => {
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

  experiment('.getInvoiceLicenceWithTransactions', () => {
    const request = {
      params: { invoiceLicenceId: 'test-id' }
    };
    beforeEach(async () => {
      await controller.getInvoiceLicenceWithTransactions(request, h);
    });

    test('calls the invoice licence service', () => {
      expect(invoiceLicenceService.getInvoiceLicenceWithTransactions.called).to.be.true();
    });
    test('calls the invoice licence service with the correct invoice licence id', () => {
      expect(invoiceLicenceService.getInvoiceLicenceWithTransactions.lastCall.args[0]).to.equal('test-id');
    });
  });

  experiment('.deleteBatchInvoice', () => {
    let request;

    beforeEach(async () => {
      request = {
        pre: {
          batch: new Batch()
        },
        params: {
          invoiceId: uuid()
        },
        messageQueue: {
          publish: sandbox.stub()
        }
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await controller.deleteBatchInvoice(request, h);
      });

      test('calls the service method with the correct batch and invoice ID', async () => {
        expect(batchService.deleteBatchInvoice.calledWith(
          request.pre.batch, request.params.invoiceId
        )).to.be.true();
      });

      test('responds with a 204 HTTP code', async () => {
        expect(hapiResponseStub.code.calledWith(204)).to.be.true();
      });
    });

    experiment('when there is a not found error', () => {
      let response;

      beforeEach(async () => {
        batchService.deleteBatchInvoice.rejects(new NotFoundError());
        response = await controller.deleteBatchInvoice(request, h);
      });

      test('responds with a Boom 404 error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when there is a batch status error', () => {
      let response;

      beforeEach(async () => {
        batchService.deleteBatchInvoice.rejects(new BatchStatusError());
        response = await controller.deleteBatchInvoice(request, h);
      });

      test('responds with a Boom 403 error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(403);
      });
    });

    experiment('when there is an unexpected error', () => {
      const err = new Error('Oh no!');
      beforeEach(async () => {
        batchService.deleteBatchInvoice.rejects(err);
      });

      test('re-throws the error', async () => {
        const func = () => controller.deleteBatchInvoice(request, h);
        const error = await expect(func()).to.reject();
        expect(error).to.equal(err);
      });
    });
  });
});

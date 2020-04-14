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
const { get } = require('lodash');

const Invoice = require('../../../src/lib/models/invoice');
const Batch = require('../../../src/lib/models/batch');
const { BATCH_STATUS, BATCH_TYPE } = Batch;

const { CHARGE_SEASON } = require('../../../src/lib/models/constants');

const newRepos = require('../../../src/lib/connectors/repos');
const eventService = require('../../../src/lib/services/events');
const invoiceService = require('../../../src/modules/billing/services/invoice-service');
const invoiceLicenceService = require('../../../src/modules/billing/services/invoice-licences-service');
const batchService = require('../../../src/modules/billing/services/batch-service');
const transactionsService = require('../../../src/modules/billing/services/transactions-service');
const controller = require('../../../src/modules/billing/controller');
const mappers = require('../../../src/modules/billing/mappers');
const { createBatch, createInvoice, createInvoiceLicence, createTransaction } = require('./test-data/test-billing-data');

const { NotFoundError } = require('../../../src/lib/errors');
const { BatchStatusError } = require('../../../src/modules/billing/lib/errors');

experiment('modules/billing/controller', () => {
  let h, hapiResponseStub, batch, tptBatch, transaction;

  beforeEach(async () => {
    hapiResponseStub = {
      code: sandbox.stub().returnsThis()
    };

    h = {
      response: sandbox.stub().returns(hapiResponseStub)
    };

    sandbox.stub(newRepos.billingBatches, 'findOne').resolves();
    sandbox.stub(batchService, 'getBatches').resolves();
    sandbox.stub(batchService, 'deleteBatch').resolves();
    sandbox.stub(batchService, 'approveBatch').resolves();
    sandbox.stub(batchService, 'decorateBatchWithTotals').resolves();
    sandbox.stub(batchService, 'getMostRecentLiveBatchByRegion').resolves();
    sandbox.stub(batchService, 'deleteAccountFromBatch').resolves();

    batch = new Batch('00000000-0000-0000-0000-000000000000');
    batch.type = 'annual';

    sandbox.stub(batchService, 'create').resolves(batch);

    sandbox.stub(invoiceService, 'getInvoiceForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesTransactionsForBatch').resolves();

    sandbox.stub(invoiceLicenceService, 'getLicencesWithTransactionStatusesForBatch').resolves();
    sandbox.stub(invoiceLicenceService, 'getInvoiceLicenceWithTransactions').resolves();
    sandbox.stub(invoiceLicenceService, 'delete').resolves();

    transaction = createTransaction();
    const invoice = createInvoice({}, [createInvoiceLicence({ transactions: [transaction] })]);
    tptBatch = createBatch({
      type: BATCH_TYPE.twoPartTariff,
      status: BATCH_STATUS.review
    }, invoice);

    sandbox.stub(transactionsService, 'getById').resolves(tptBatch);
    sandbox.stub(transactionsService, 'updateTransactionVolume').resolves(transaction);

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
          season: CHARGE_SEASON.summer
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
          request.payload.season
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
          season: CHARGE_SEASON.summer
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
    let request;

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
        const [batch] = invoiceService.getInvoicesForBatch.lastCall.args;
        expect(batch).to.equal(request.pre.batch);
      });

      test('the response is mapped using the appropriate mapper', async () => {
        expect(mappers.api.invoice.modelToBatchInvoices.callCount).to.equal(2);
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[0])).to.be.true();
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[1])).to.be.true();
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

  experiment('.deleteAccountFromBatch', () => {
    let batch;
    let request;
    let invoices;

    beforeEach(async () => {
      batch = new Batch(uuid());
      batch.status = Batch.BATCH_STATUS.ready;
      request = {
        params: { batchId: batch.id, accountId: 'test-account-id' },
        pre: { batch },
        messageQueue: {
          publish: sandbox.stub()
        }
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
      batchService.deleteAccountFromBatch.resolves(batch);
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
        experiment(`for the ${status} status`, () => {
          beforeEach(async () => {
            batch.status = status;
            invoices[0].invoiceAccount.id = 'test-account-id';
            await controller.deleteAccountFromBatch(request, h);
          });

          test('the account is deleted', async () => {
            const [batchArg, accountId] = batchService.deleteAccountFromBatch.lastCall.args;
            expect(batchArg.id).to.equal(batch.id);
            expect(accountId).to.equal('test-account-id');
          });

          test('a job is published to refresh the batch totals', async () => {
            const [message] = request.messageQueue.publish.lastCall.args;
            expect(message.data.batchId).to.equal(request.params.batchId);
          });
        });
      });
    });

    test('returns a 404 if there are no invoices for the invoice account id', async () => {
      batch.status = Batch.BATCH_STATUS.ready;
      const response = await controller.deleteAccountFromBatch(request);
      expect(invoiceService.getInvoicesForBatch.calledWith(batch)).to.be.true();
      expect(response.output.payload.statusCode).to.equal(404);
      expect(response.output.payload.message).to.equal(`No invoices for account (test-account-id) in batch (${batch.id})`);
    });

    test('returns the batch', async () => {
      invoices[0].invoiceAccount.id = 'test-account-id';
      const response = await controller.deleteAccountFromBatch(request);
      expect(response.id).to.equal(batch.id);
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

  experiment('.getBatchLicences', () => {
    const createBatchStatusRequest = batchStatus => ({
      pre: {
        batch: new Batch().fromHash({
          status: batchStatus
        })
      }
    });

    experiment('when a batch has a processing state', () => {
      let request;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.processing);
        await controller.getBatchLicences(request, h);
      });

      test('a 403 is returned', async () => {
        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(403);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch has an error state', () => {
      let request;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.error);
        await controller.getBatchLicences(request, h);
      });

      test('a 403 is returned', async () => {
        const [code] = hapiResponseStub.code.lastCall.args;
        expect(code).to.equal(403);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch has an empty state', () => {
      let request;
      let response;

      beforeEach(async () => {
        request = createBatchStatusRequest(BATCH_STATUS.empty);
        response = await controller.getBatchLicences(request, h);
      });

      test('an empty array is returned', async () => {
        expect(response).to.equal([]);
      });

      test('no attempt is made to get the underlying data', async () => {
        expect(invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.called).to.be.false();
      });
    });

    experiment('when a batch is in a state to return data', () => {
      const validStatuses = [
        BATCH_STATUS.sent,
        BATCH_STATUS.ready,
        BATCH_STATUS.review
      ];

      validStatuses.forEach(status => {
        test(`the expected data is returned for a ${status} batch`, async () => {
          const fakeResponse = [{ id: 1 }, { id: 2 }];
          invoiceLicenceService.getLicencesWithTransactionStatusesForBatch.resolves(fakeResponse);

          const request = createBatchStatusRequest(status);
          const response = await controller.getBatchLicences(request, h);

          expect(response).to.equal(fakeResponse);
        });
      });
    });
  });

  experiment('.patchTransaction', () => {
    let request, result;
    const createRequest = volume => ({
      defra: {
        internalCallingUser: {
          id: 1234,
          email: 'test@example.com'
        }
      },
      params: { transactionId: 'test-transaction-id' },
      payload: { volume }
    });

    beforeEach(async () => {
      request = createRequest(20);
      result = await controller.patchTransaction(request, h);
    });

    test('the transactions service is called to get the transaction with related data', async () => {
      expect(
        transactionsService.getById.calledWith(request.params.transactionId)
      ).to.be.true();
    });
    experiment('when the transaction data is found', async () => {
      experiment('and updateTransactionVolume is successful', async () => {
        test('the transaction service is called to update the transaction', async () => {
          const transactionToBeUpdated = get(tptBatch, 'invoices[0].invoiceLicences[0].transactions[0]');

          const [batch, transaction, volume, user] = transactionsService.updateTransactionVolume.lastCall.args;

          expect(batch).to.equal(tptBatch);
          expect(transaction).to.equal(transactionToBeUpdated);
          expect(volume).to.equal(request.payload.volume);
          expect(user).to.equal(request.defra.internalCallingUser);
        });

        test('the updated transaction is returned', async () => {
          expect(result).to.equal(transaction);
        });
      });
      experiment('and updateTransactionVolume rejects', async () => {
        test('it throws Boom bad request error', async () => {
          const errMsg = 'oh no, something went wrong';
          transactionsService.updateTransactionVolume.rejects(new Error(errMsg));
          try {
            await controller.patchTransaction(request, h);
          } catch (err) {
            expect(err.isBoom).to.be.true();
            expect(err.message).to.equal(errMsg);
            expect(err.output.statusCode).to.equal(400);
          }
        });
      });
    });
    experiment('when the transaction data is not found', async () => {
      test('throws Boom not found error', async () => {
        transactionsService.getById.resolves();
        try {
          await controller.patchTransaction(request, h);
        } catch (err) {
          expect(err.isBoom).to.be.true();
          expect(err.output.statusCode).to.equal(404);
          expect(err.message).to.equal('No transaction (00112233-4455-6677-8899-aabbccddeeff) found');
        }
      });
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

  experiment('.deleteInvoiceLicence', () => {
    let response;
    const request = {
      params: {
        invoiceLicenceId: uuid()
      }
    };

    experiment('when the invoiceLicence is deleted', () => {
      beforeEach(async () => {
        await controller.deleteInvoiceLicence(request, h);
      });

      test('the invoiceLicence service method is called with the correct ID', async () => {
        expect(invoiceLicenceService.delete.calledWith(request.params.invoiceLicenceId)).to.be.true();
      });

      test('the response has a 204 HTTP status code', async () => {
        expect(hapiResponseStub.code.calledWith(204)).to.be.true();
      });
    });

    experiment('when the invoiceLicence is not found', () => {
      beforeEach(async () => {
        invoiceLicenceService.delete.rejects(new NotFoundError());
        response = await controller.deleteInvoiceLicence(request, h);
      });

      test('the response is a Boom 404 error', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
      });
    });

    experiment('when the batch has the wrong status is not found', () => {
      beforeEach(async () => {
        invoiceLicenceService.delete.rejects(new BatchStatusError());
        response = await controller.deleteInvoiceLicence(request, h);
      });

      test('the response is a Boom 403 error - forbidden', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(403);
      });
    });

    experiment('if an unexpected error occurs', () => {
      beforeEach(async () => {
        invoiceLicenceService.delete.rejects(new Error('oh no'));
      });

      test('the error is rethrown', async () => {
        const func = () => controller.deleteInvoiceLicence(request, h);
        expect(func()).to.reject();
      });
    });
  });
});

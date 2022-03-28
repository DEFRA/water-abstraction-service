'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const config = require('../../../../config');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Invoice = require('../../../../src/lib/models/invoice');
const Batch = require('../../../../src/lib/models/batch');
const { BATCH_STATUS, BATCH_TYPE } = Batch;

const newRepos = require('../../../../src/lib/connectors/repos');
const eventService = require('../../../../src/lib/services/events');
const invoiceService = require('../../../../src/lib/services/invoice-service');
const invoiceLicenceService = require('../../../../src/modules/billing/services/invoice-licences-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const transactionsService = require('../../../../src/modules/billing/services/transactions-service');
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const importConnector = require('../../../../src/lib/connectors/import');
const chargeVersionService = require('../../../../src/lib/services/charge-versions');

const controller = require('../../../../src/modules/billing/controllers/batches');
const mappers = require('../../../../src/modules/billing/mappers');
const { logger } = require('../../../../src/logger');
const { createBatch, createTransaction, createInvoice, createInvoiceLicence, createFinancialYear, createBillingVolume } = require('../test-data/test-billing-data');

const { NotFoundError } = require('../../../../src/lib/errors');
const { BatchStatusError } = require('../../../../src/modules/billing/lib/errors');

const chargeElement = {
  chargeVersionId: 'test-charge-version-id',
  externalId: '8:1234566',
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 4,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 3,
  authorisedAnnualQuantity: '28',
  season: 'all year',
  seasonDerived: 'all year',
  source: 'unsupported',
  loss: 'medium',
  factorsOverridden: false,
  billableAnnualQuantity: '9.33',
  timeLimitedStartDate: null,
  timeLimitedEndDate: null,
  description: 'Farm, Farmshire',
  isSection127AgreementEnabled: true,
  volume: null,
  isSection126AgreementEnabled: false,
  isSection130AgreementEnabled: false,
  eiucRegion: null,
  purposeUse: {
    legacyId: '50',
    description: 'Drinking, Cooking, Sanitary, Washing, (Small Garden) - Household',
    lossFactor: 'medium',
    isTwoPartTariff: false
  }
};

const getInvoices = () => [
  {
    address: {
    },
    invoiceAccountNumber: 'W88888888A',
    netAmount: '2646.00',
    isCredit: false,
    billingBatchId: '00efa162-7d2b-42aa-8a24-774c45f4a20c',
    financialYearEnding: 2021,
    invoiceNumber: 'WAI123456789',
    legacyId: '8:1234567',
    creditNoteValue: null,
    invoiceValue: null,
    isDeMinimis: false,
    externalId: null,
    billingInvoiceLicences: [
      {
        licenceRef: '19/55/12/0856/R01',
        licence: {
          licenceRef: '11/22/33/4444',
          isWaterUndertaker: false,
          regions: {
            historicalAreaCode: 'SE',
            regionalChargeArea: 'Wales',
            standardUnitChargeCode: 'SUC',
            localEnvironmentAgencyPlanCode: 'WYLPE'
          },
          startDate: '2015-05-05',
          expiredDate: '2027-03-31',
          includeInSupplementaryBilling: 'no',
          region: {
            chargeRegionId: 'W',
            name: 'EA Wales',
            displayName: 'Wales'
          }
        },
        billingTransactions: [
          {
            startDate: '2021-02-23',
            endDate: '2021-03-31',
            abstractionPeriod: {
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 4
            },
            source: 'unsupported',
            season: 'all year',
            loss: 'medium',
            netAmount: '882.00',
            isCredit: false,
            chargeType: 'standard',
            authorisedQuantity: '28',
            billableQuantity: '9.33',
            authorisedDays: 365,
            billableDays: 37,
            status: 'charge_created',
            description: 'Farm, Farmshire',
            externalId: null,
            volume: '9.33',
            section126Factor: null,
            section127Agreement: false,
            section130Agreement: null,
            isNewLicence: true,
            isDeMinimis: false,
            legacyId: '8:1234567',
            sourceTransactionId: null,
            calcSourceFactor: '1',
            calcSeasonFactor: '1',
            calcLossFactor: '0.6',
            calcSucFactor: '15.54',
            calcS126Factor: null,
            calcS127Factor: null,
            calcEiucFactor: '0',
            calcEiucSourceFactor: '0',
            isCreditedBack: false,
            isTwoPartSecondPartCharge: false,
            chargeElement,
            billingVolume: [
            ]
          },
          {
            startDate: '2021-02-23',
            endDate: '2021-03-31',
            abstractionPeriod: {
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 4
            },
            source: 'unsupported',
            season: 'all year',
            loss: 'medium',
            netAmount: '0',
            isCredit: false,
            chargeType: 'compensation',
            authorisedQuantity: '28',
            billableQuantity: '9.33',
            authorisedDays: 365,
            billableDays: 37,
            status: 'charge_created',
            description: 'Compensation Charge',
            externalId: null,
            volume: '9.33',
            section126Factor: null,
            section127Agreement: false,
            section130Agreement: null,
            isNewLicence: true,
            isDeMinimis: false,
            legacyId: 'legacy-id',
            sourceTransactionId: null,
            calcSourceFactor: '0',
            calcSeasonFactor: '1',
            calcLossFactor: '0.6',
            calcSucFactor: '0',
            calcS126Factor: null,
            calcS127Factor: null,
            calcEiucFactor: '0',
            calcEiucSourceFactor: '1',
            isCreditedBack: false,
            isTwoPartSecondPartCharge: false,
            chargeElement,
            billingVolume: [
            ]
          }
        ]
      }
    ],
    invoiceAccount: {
      invoiceAccountNumber: 'W88888888A',
      startDate: '2021-03-05',
      endDate: null,
      lastTransactionFileReference: null,
      dateLastTransactionFileReferenceUpdated: null,
      company: {
        name: 'Farm.co',
        type: 'organisation',
        companyNumber: null,
        organisationType: null
      },
      invoiceAccountAddresses: [
        {
          startDate: '2021-03-05',
          endDate: null,
          contactId: null,
          address: {
            address1: 'c/o Tony Waldon',
            address2: 'Laddin Farm',
            address3: 'Little Marcle',
            address4: null,
            town: 'Ledbury',
            county: 'HEREFORDSHIRE',
            postcode: 'HR8 2LB',
            country: null
          }
        }
      ]
    }
  },
  {
    billingInvoiceId: '3aaa80be-f95f-4eda-a442-29dac25c1716',
    invoiceAccountId: '27a91d9f-f037-4132-bb41-49add68e1a2a',
    address: {
    },
    invoiceAccountNumber: 'W88898922A',
    netAmount: '1401.00',
    isCredit: false,
    billingBatchId: '00efa162-7d2b-42aa-8a24-774c45f4a20c',
    financialYearEnding: 2021,
    invoiceNumber: 'WAI0303965',
    legacyId: '8:1053734',
    metadata: {},
    creditNoteValue: null,
    invoiceValue: null,
    isDeMinimis: false,
    externalId: null,
    isFlaggedForRebilling: false,
    originalBillingInvoiceId: null,
    rebillingState: 'unrebillable',
    billingInvoiceLicences: [
      {
        licenceRef: '19/55/12/0811',
        licence: {
          licenceRef: '19/55/12/0811',
          isWaterUndertaker: false,
          regions: {
            historicalAreaCode: 'SE',
            regionalChargeArea: 'Wales',
            standardUnitChargeCode: 'SUC',
            localEnvironmentAgencyPlanCode: 'WYLPE'
          },
          startDate: '1997-06-06',
          region: {
            chargeRegionId: 'W',
            naldRegionId: 8,
            name: 'EA Wales',
            displayName: 'Wales'
          }
        },
        billingTransactions: [
          {
            startDate: '2021-02-23',
            endDate: '2021-03-31',
            abstractionPeriod: {
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 11
            },
            source: 'unsupported',
            season: 'winter',
            loss: 'high',
            netAmount: '1401.00',
            isCredit: false,
            chargeType: 'standard',
            authorisedQuantity: '23',
            billableQuantity: null,
            authorisedDays: 151,
            billableDays: 37,
            status: 'charge_created',
            description: 'Abstraction to fill a storage pond for subsequent spray irrigation',
            externalId: null,
            volume: '23',
            section126Factor: null,
            section127Agreement: false,
            section130Agreement: null,
            isNewLicence: true,
            isDeMinimis: false,
            legacyId: '8:1325607:S',
            sourceTransactionId: null,
            calcSourceFactor: '1',
            calcSeasonFactor: '0.16',
            calcLossFactor: '1',
            calcSucFactor: '15.54',
            calcS126Factor: null,
            calcS127Factor: null,
            calcEiucFactor: '0',
            calcEiucSourceFactor: '0',
            isCreditedBack: false,
            isTwoPartSecondPartCharge: false,
            chargeElement,
            billingVolume: [
            ]
          },
          {
            startDate: '2021-02-23',
            endDate: '2021-03-31',
            abstractionPeriod: {
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 11
            },
            source: 'unsupported',
            season: 'winter',
            loss: 'high',
            netAmount: '0',
            isCredit: false,
            chargeType: 'compensation',
            authorisedQuantity: '23',
            billableQuantity: null,
            authorisedDays: 151,
            billableDays: 37,
            status: 'charge_created',
            description: 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element',
            externalId: null,
            volume: '23',
            section126Factor: null,
            section127Agreement: false,
            section130Agreement: null,
            isNewLicence: true,
            isDeMinimis: false,
            legacyId: '8:1325607:C',
            sourceTransactionId: null,
            calcSourceFactor: '0',
            calcSeasonFactor: '0.16',
            calcLossFactor: '1',
            calcSucFactor: '0',
            calcS126Factor: null,
            calcS127Factor: null,
            calcEiucFactor: '0',
            calcEiucSourceFactor: '1',
            isCreditedBack: false,
            isTwoPartSecondPartCharge: false,
            chargeElement,
            billingVolume: [
            ]
          }
        ]
      }
    ],
    invoiceAccount: {
      invoiceAccountNumber: 'W88898922A',
      startDate: '2021-03-05',
      endDate: null,
      lastTransactionFileReference: null,
      dateLastTransactionFileReferenceUpdated: null,
      company: {
        name: 'Farm, Farmshire',
        type: 'organisation',
        companyNumber: null,
        externalId: '8:10028205',
        organisationType: null
      },
      invoiceAccountAddresses: [
        {
          startDate: '2021-03-05',
          endDate: null,
          agentCompanyId: null,
          contactId: null,
          address: {
            address1: 'c/o Tony Waldon',
            address2: 'Laddin Farm',
            address3: 'Little Marcle',
            address4: null,
            town: 'Ledbury',
            county: 'HEREFORDSHIRE',
            postcode: 'HR8 2LB',
            country: null
          }
        }
      ]
    }
  }
];

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
    sandbox.stub(batchService, 'getExistingOrDuplicateSentBatch').resolves();
    sandbox.stub(batchService, 'approveTptBatchReview').resolves(processingBatch);
    sandbox.stub(batchService, 'deleteBatchInvoice').resolves();
    sandbox.stub(batchService, 'deleteAllBillingData').resolves();
    sandbox.stub(batchService, 'setStatus').resolves({
      id: 'test-batch-id',
      status: 'processsing'
    });

    sandbox.stub(chargeVersionService, 'getManyByChargeVersionIds').resolves();

    sandbox.stub(invoiceService, 'getInvoiceForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatch').resolves();
    sandbox.stub(invoiceService, 'getInvoicesForBatchDownload').resolves();
    sandbox.stub(invoiceService, 'getInvoicesTransactionsForBatch').resolves();

    sandbox.stub(invoiceLicenceService, 'getInvoiceLicenceWithTransactions').resolves();

    sandbox.stub(transactionsService, 'getById').resolves(tptBatch);
    sandbox.stub(billingVolumesService, 'updateBillingVolume').resolves(billingVolume);
    sandbox.stub(billingVolumesService, 'approveVolumesForBatch');

    sandbox.stub(eventService, 'create').resolves({
      id: '11111111-1111-1111-1111-111111111111'
    });

    sandbox.stub(mappers.api.invoice, 'modelToBatchInvoices');

    sandbox.stub(importConnector, 'postImportChargeVersions').resolves();

    sandbox.stub(logger, 'error').resolves();
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
        queueManager: {
          add: sandbox.stub().resolves()
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
        expect(request.queueManager.add.called).to.be.false();
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

      test('publishes a new job to the message queue with the batch ID', async () => {
        const [jobName, batchId] = request.queueManager.add.lastCall.args;
        expect(jobName).to.equal('billing.create-bill-run');
        expect(batchId).to.equal(batch.id);
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
        queueManager: {
          add: sandbox.stub().resolves()
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
    let result, request;

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

      result = await controller.getBatch(request);
    });

    test('returns the batch in request.pre', async () => {
      expect(result).to.equal(request.pre.batch);
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
        const [batch, { includeInvoiceAccounts }] = invoiceService.getInvoicesForBatch.lastCall.args;
        expect(batch).to.equal(request.pre.batch);
        expect(includeInvoiceAccounts).to.equal(true);
      });

      test('the response is mapped using the appropriate mapper', async () => {
        expect(mappers.api.invoice.modelToBatchInvoices.callCount).to.equal(2);
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[0])).to.be.true();
        expect(mappers.api.invoice.modelToBatchInvoices.calledWith(invoices[1])).to.be.true();
      });
    });

    experiment('when the batch is not found', () => {
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

    experiment('when the deletion succeeds', () => {
      test('deletes the batch via the batch service', async () => {
        // batch.status = Batch.BATCH_STATUS.review;
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
        id: 'test-batch-id'
      };

      request = {
        defra: {
          internalCallingUser
        },
        pre: {
          batch
        },
        queueManager: {
          add: sandbox.stub().resolves()
        }
      };

      await controller.postApproveBatch(request, h);
    });

    test('publishes a new job to the message queue with the batch ID', async () => {
      const [jobName, batchId] = request.queueManager.add.lastCall.args;
      expect(jobName).to.equal('billing.approve-batch');
      expect(batchId).to.equal(batch.id);
    });

    test('returns the approved batch', async () => {
      const batch = {
        id: 'test-batch-id',
        status: 'processsing'
      };
      batchService.approveBatch.resolves(batch);

      const result = await controller.postApproveBatch(request, h);

      expect(result).to.equal(batch);
    });

    test('returns the error from the service if it fails', async () => {
      const err = new Error('whoops');
      request.queueManager.add.rejects(err);
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

  experiment('.getBatchDownloadData', () => {
    let request, invoices, result;
    beforeEach(async () => {
      request = {
        pre: { batch: { id: 'test-batch-id' } }
      };
      invoices = getInvoices();

      invoiceService.getInvoicesForBatchDownload.resolves(invoices);
      chargeVersionService.getManyByChargeVersionIds.resolves([{ foo: 'bar' }]);
      result = await controller.getBatchDownloadData(request, h);
    });

    test('calls the invoice service with expected params', () => {
      expect(invoiceService.getInvoicesForBatchDownload.calledWith(request.pre.batch)).to.be.true();
    });

    test('calls the charge version service with unique list of charge version ids', () => {
      expect(chargeVersionService.getManyByChargeVersionIds.calledWith(
        ['test-charge-version-id']
      )).to.be.true();
    });

    test('returns the result of both service calls', () => {
      expect(result.invoices).to.be.equal(invoices);
      expect(result.chargeVersions).to.be.equal([{ foo: 'bar' }]);
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
        queueManager: {
          add: sandbox.stub()
        },
        query: {
          originalInvoiceId: uuid(),
          rebillInvoiceId: uuid()
        }
      };
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await controller.deleteBatchInvoice(request, h);
      });

      test('calls the service method with the correct batch and invoice ID', async () => {
        expect(batchService.deleteBatchInvoice.calledWith(
          request.pre.batch, request.params.invoiceId, request.query.originalInvoiceId, request.query.rebillInvoiceId
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

  experiment('.deleteAllBillingData', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await controller.deleteAllBillingData({}, h);
      });

      test('the batch service is called to delete all billing/charge version data', async () => {
        expect(batchService.deleteAllBillingData.called).to.be.true();
      });

      test('the import service is called to re-import charge versions', async () => {
        expect(importConnector.postImportChargeVersions.called).to.be.true();
      });

      test('returns a 204 http status code', async () => {
        expect(h.response.called).to.be.true();
        expect(hapiResponseStub.code.calledWith(204)).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      const err = new Error('oops');

      beforeEach(async () => {
        batchService.deleteAllBillingData.rejects(err);
      });

      test('an error is logged and re-thrown', async () => {
        const func = () => controller.deleteAllBillingData();
        const result = await expect(func()).to.reject();
        expect(logger.error.calledWith(
          'Error deleting all billing data', err
        )).to.be.true();
        expect(result).to.equal(err);
      });
    });
  });

  experiment('.postSetBatchStatusToCancel', () => {
    let request;
    let batch;
    beforeEach(async () => {
      batch = new Batch(uuid());
      batch.status = 'processing';
      request = {
        payload: {
          userEmail: 'test@example.com',
          regionId: '22222222-2222-2222-2222-222222222222',
          batchType: 'annual',
          financialYearEnding: 2019,
          isSummer: true
        },
        queueManager: {
          add: sandbox.stub().resolves(),
          deleteKeysByPattern: sandbox.stub().resolves()
        },
        pre: { batch }
      };
      await controller.postCreateBatch(request, h);
    });

    test('publishes a new job to the message queue with the batch ID', async () => {
      const [jobName, batchId] = request.queueManager.add.lastCall.args;
      expect(jobName).to.equal('billing.create-bill-run');
      expect(batchId).to.equal('00000000-0000-0000-0000-000000000000');
    });

    test('returns request has succeeded in changing batch status to cancel', async () => {
      await controller.postSetBatchStatusToCancel(request, h);
      const [code] = hapiResponseStub.code.lastCall.args;
      expect(code).to.equal(204);
    });

    test('returns the error from the service if it fails', async () => {
      const err = new Error('Failed to change batch status to cancel');
      batchService.setStatus.rejects(err);
      const result = await controller.postSetBatchStatusToCancel(request, h);
      expect(result).to.equal(err);
    });
  });
});

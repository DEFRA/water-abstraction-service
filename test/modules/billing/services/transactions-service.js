const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const transactionsService = require('../../../../src/modules/billing/services/transactions-service');
const chargeModuleTransactionsConnector = require('../../../../src/lib/connectors/charge-module/transactions');
const repos = require('../../../../src/lib/connectors/repository');

// Models
const Agreement = require('../../../../src/lib/models/agreement');
const ChargeModuleTransaction = require('../../../../src/lib/models/charge-module-transaction');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const DateRange = require('../../../../src/lib/models/date-range');
const Batch = require('../../../../src/lib/models/batch');
const Region = require('../../../../src/lib/models/region');

const createChargeElement = () => {
  const chargeElement = new ChargeElement('29328315-9b24-473b-bde7-02c60e881501');
  chargeElement.fromHash({
    source: 'supported',
    season: 'summer',
    loss: 'low',
    authorisedAnnualQuantity: 12.5,
    billableAnnualQuantity: 10
  });
  chargeElement.abstractionPeriod = new AbstractionPeriod();
  chargeElement.abstractionPeriod.fromHash({
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  });
  return chargeElement;
};

const createTransaction = (options = {}) => {
  const transaction = new Transaction();
  transaction.fromHash({
    chargeElement: createChargeElement(),
    chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    volume: 5.64
  });
  return transaction;
};

const createLicence = () => {
  const licence = new Licence();
  licence.fromHash({
    id: '4838e713-9499-4b9d-a7c0-c4c9a008a589',
    licenceNumber: '01/123/ABC',
    isWaterUndertaker: true
  });
  licence.region = new Region();
  licence.region.fromHash({
    type: Region.types.region,
    name: 'Anglian',
    code: 'A',
    numericCode: 3
  });
  licence.regionalChargeArea = new Region();
  licence.regionalChargeArea.fromHash({
    type: Region.types.regionalChargeArea,
    name: 'Anglian'
  });
  licence.historicalArea = new Region();
  licence.historicalArea.fromHash({
    type: Region.types.environmentAgencyArea,
    code: 'ARCA'
  });
  return licence;
};

const createInvoiceLicence = (options = {}) => {
  const invoiceLicence = new InvoiceLicence('c4fd4bf6-9565-4ff8-bdba-e49355446d7b');
  invoiceLicence.transactions = [
    createTransaction(options)
  ];
  invoiceLicence.licence = createLicence();
  return invoiceLicence;
};

const createInvoice = () => {
  const invoice = new Invoice();
  invoice.invoiceAccount = new InvoiceAccount();
  invoice.invoiceAccount.fromHash({
    accountNumber: 'A12345678A'
  });
  return invoice;
};

const createChargeLine = (isWaterUndertaker = false) => ({
  startDate: '2018-04-01',
  endDate: '2019-03-31',
  section127Agreement: true,
  chargeVersion: {
    isWaterUndertaker
  },
  chargeElements: [{
    chargeElementId: 'bf679fc9-dec9-42cd-bc32-542578be01d9',
    source: 'supported',
    season: 'summer',
    loss: 'low',
    totalDays: 365,
    billableDays: 200,
    description: 'Tiny pond',
    abstractionPeriodStartDay: 1,
    abstractionPeriodStartMonth: 2,
    abstractionPeriodEndDay: 3,
    abstractionPeriodEndMonth: 4
  }]
});

const createBatch = () => {
  const batch = new Batch('d65bf89e-4a84-4f2e-8fc1-ebc5ff08c125');
  batch.fromHash({
    type: 'supplementary'
  });
  return batch;
};

const createAgreement = (code, factor) => {
  const agreement = new Agreement();
  agreement.code = code;
  if (factor !== undefined) {
    agreement.factor = factor;
  }
  return agreement;
};

experiment('modules/billing/services/transactions-service', () => {
  let transactions;

  beforeEach(async () => {
    transactions = [
      {
        id: '782cdbcb-8975-4058-bccf-932f36af678a',
        customerReference: 'A11223344A',
        batchNumber: 'ABC1',
        licenceNumber: '123/ABC',
        twoPartTariff: false,
        chargeValue: 6134,
        credit: false,
        transactionStatus: 'unbilled',
        approvedForBilling: false,
        volume: 4.2
      },
      {
        id: '888fa748-4b1c-4466-ad07-4d7705728da0',
        customerReference: 'A55667788A',
        batchNumber: 'ABC1',
        licenceNumber: '123/ABC',
        twoPartTariff: false,
        chargeValue: -1421,
        credit: true,
        transactionStatus: 'unbilled',
        approvedForBilling: false,
        volume: 5.6
      }
    ];

    sandbox.stub(chargeModuleTransactionsConnector, 'getTransactionQueue').resolves({
      pagination: { page: 1, perPage: 50, pageCount: 1, recordCount: 2 },
      data: {
        transactions
      }
    });

    sandbox.stub(repos.billingTransactions, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTransactionsForBatch', () => {
    let result;

    beforeEach(async () => {
      result = await transactionsService.getTransactionsForBatch('test-batch-id');
    });

    test('calls the connector code with the batch id', async () => {
      const [batchId] = chargeModuleTransactionsConnector.getTransactionQueue.lastCall.args;
      expect(batchId).to.equal('test-batch-id');
    });

    test('returns an array of ChargeModuleTransaction objects', async () => {
      expect(result).to.be.an.array();
      expect(result[0]).to.be.an.instanceOf(ChargeModuleTransaction);
      expect(result[1]).to.be.an.instanceOf(ChargeModuleTransaction);
    });

    test('the transactions have the expected data', async () => {
      const transaction = result[0];
      expect(transaction.id).to.equal(transactions[0].id);
      expect(transaction.licenceNumber).to.equal(transactions[0].licenceNumber);
      expect(transaction.accountNumber).to.equal(transactions[0].customerReference);
      expect(transaction.isCredit).to.equal(transactions[0].credit);
      expect(transaction.value).to.equal(transactions[0].chargeValue);
    });
  });

  experiment('.getTransactionsForBatchInvoice', () => {
    let result;

    beforeEach(async () => {
      result = await transactionsService.getTransactionsForBatchInvoice('test-batch-id', 'test-customer');
    });

    test('calls the connector code with the batch id and customer reference', async () => {
      const [, customerRef] = chargeModuleTransactionsConnector.getTransactionQueue.lastCall.args;
      expect(customerRef).to.equal('test-customer');
    });

    test('returns an array of ChargeModuleTransaction objects', async () => {
      expect(result).to.be.an.array();
      expect(result[0]).to.be.an.instanceOf(ChargeModuleTransaction);
      expect(result[1]).to.be.an.instanceOf(ChargeModuleTransaction);
    });

    test('the transactions have the expected data', async () => {
      const transaction = result[0];
      expect(transaction.id).to.equal(transactions[0].id);
      expect(transaction.licenceNumber).to.equal(transactions[0].licenceNumber);
      expect(transaction.accountNumber).to.equal(transactions[0].customerReference);
      expect(transaction.isCredit).to.equal(transactions[0].credit);
      expect(transaction.value).to.equal(transactions[0].chargeValue);
    });
  });

  experiment('.mapChargeToTransactions', () => {
    let result, chargeLine;

    experiment('for a supplementary batch, and a non-water undertaker licence', () => {
      let batch;

      beforeEach(async () => {
        chargeLine = createChargeLine();
        batch = new Batch();
        batch.type = 'supplementary';
        result = transactionsService.mapChargeToTransactions(chargeLine, batch);
      });

      test('2 transactions are created', async () => {
        expect(result).to.be.an.array().length(2);
      });

      experiment('the first transaction', () => {
        test('is a standard charge', async () => {
          expect(result[0].isCompensationCharge).to.be.false();
        });

        test('is not two-part tariff supplementary charge by default', async () => {
          expect(result[0].isTwoPartTariffSupplementaryCharge).to.equal(false);
        });

        test('is not a credit', async () => {
          expect(result[0].isCredit).to.equal(false);
        });

        test('has the correct billable and authorised days', async () => {
          expect(result[0].authorisedDays).to.equal(chargeLine.chargeElements[0].totalDays);
          expect(result[0].billableDays).to.equal(chargeLine.chargeElements[0].billableDays);
        });

        test('has the correct description', async () => {
          expect(result[0].description).to.equal(chargeLine.chargeElements[0].description);
        });

        test('has the charge period mapped correctly', async () => {
          expect(result[0].chargePeriod.startDate).to.equal(chargeLine.startDate);
          expect(result[0].chargePeriod.endDate).to.equal(chargeLine.endDate);
        });

        test('has the charge element mapped correctly', async () => {
          const { chargeElement } = result[0];
          expect(chargeElement.id).to.equal(chargeLine.chargeElements[0].chargeElementId);
          expect(chargeElement.source).to.equal(chargeLine.chargeElements[0].source);
          expect(chargeElement.season).to.equal(chargeLine.chargeElements[0].season);
          expect(chargeElement.loss).to.equal(chargeLine.chargeElements[0].loss);
        });

        test('has the abstraction period mapped correctly', async () => {
          const { abstractionPeriod } = result[0].chargeElement;
          expect(abstractionPeriod.startDay).to.equal(chargeLine.chargeElements[0].abstractionPeriodStartDay);
          expect(abstractionPeriod.startMonth).to.equal(chargeLine.chargeElements[0].abstractionPeriodStartMonth);
          expect(abstractionPeriod.endDay).to.equal(chargeLine.chargeElements[0].abstractionPeriodEndDay);
          expect(abstractionPeriod.endMonth).to.equal(chargeLine.chargeElements[0].abstractionPeriodEndMonth);
        });

        test('has agreements mapped correctly', async () => {
          const { agreements } = result[0];
          expect(agreements).to.be.an.array().length(1);
          expect(agreements[0].code).to.equal('S127');
        });
      });

      experiment('the second transaction', () => {
        test('is a compensation charge', async () => {
          expect(result[1].isCompensationCharge).to.be.true();
        });
      });
    });

    experiment('when processing two-part tariff supplementary', () => {
      let batch, chargeLine;

      beforeEach(async () => {
        chargeLine = createChargeLine();
        batch = new Batch();
        batch.type = 'two_part_tariff';
        result = transactionsService.mapChargeToTransactions(chargeLine, batch);
      });

      test('1 transactions is created', async () => {
        expect(result).to.be.an.array().length(1);
      });

      test('the transaction is a standard charge', async () => {
        expect(result[0].isCompensationCharge).to.be.false();
      });

      test('the transaction is a two-part tariff supplementary charge', async () => {
        expect(result[0].isTwoPartTariffSupplementaryCharge).to.be.true();
      });
    });

    experiment('when processing a supplementary charge for a water undertaker', () => {
      let batch, chargeLine;

      beforeEach(async () => {
        chargeLine = createChargeLine(true);
        batch = new Batch();
        batch.type = 'supplementary';
        result = transactionsService.mapChargeToTransactions(chargeLine, batch);
      });

      test('1 transactions is created', async () => {
        expect(result).to.be.an.array().length(1);
      });

      test('the transaction is a standard charge', async () => {
        expect(result[0].isCompensationCharge).to.be.false();
      });

      test('the transaction is not a two-part tariff supplementary charge', async () => {
        expect(result[0].isTwoPartTariffSupplementaryCharge).to.be.false();
      });
    });
  });

  experiment('.mapTransactionToDB', () => {
    let invoiceLicence, result;

    experiment('when the transaction is a standard charge', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence();
        result = transactionsService.mapTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the result is mapped correctly', async () => {
        expect(result).to.equal({
          billing_invoice_licence_id: 'c4fd4bf6-9565-4ff8-bdba-e49355446d7b',
          charge_element_id: '29328315-9b24-473b-bde7-02c60e881501',
          start_date: '2019-04-01',
          end_date: '2020-03-31',
          abstraction_period: {
            startDay: 1,
            startMonth: 1,
            endDay: 31,
            endMonth: 12
          },
          source: 'supported',
          loss: 'low',
          season: 'summer',
          is_credit: false,
          charge_type: 'standard',
          authorised_quantity: 12.5,
          billable_quantity: 10,
          authorised_days: 366,
          billable_days: 366,
          description: 'Tiny pond',
          status: Transaction.statuses.candidate,
          volume: 5.64,
          section_126_factor: 1,
          section_127_agreement: false,
          section_130_agreement: null
        });
      });
    });

    experiment('when the transaction is a compensation charge', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        result = transactionsService.mapTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the charge type is "compensation"', async () => {
        expect(result.charge_type).to.equal('compensation');
      });
    });

    experiment('when the transaction has a two-part tariff agreement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S127')];
        result = transactionsService.mapTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section_126_factor).to.equal(1);
        expect(result.section_127_agreement).to.equal(true);
        expect(result.section_130_agreement).to.equal(null);
      });
    });

    experiment('when the transaction has a canal & rivers trust agreement agreement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S130U')];
        result = transactionsService.mapTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section_126_factor).to.equal(1);
        expect(result.section_127_agreement).to.equal(false);
        expect(result.section_130_agreement).to.equal('S130U');
      });
    });

    experiment('when the transaction has an abatement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S126', 0.4)];
        result = transactionsService.mapTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section_126_factor).to.equal(0.4);
        expect(result.section_127_agreement).to.equal(false);
        expect(result.section_130_agreement).to.equal(null);
      });
    });
  });

  experiment('.mapDBToModel', () => {
    let result, chargeElement;

    const dbRow = {
      billing_transaction_id: '7d2c249d-0f56-40fa-90f0-fb2b7f8f698a',
      status: 'candidate',
      is_credit: false,
      authorised_days: 365,
      billable_days: 250,
      start_date: '2019-04-01',
      end_date: '2020-03-31',
      charge_type: 'compensation',
      description: 'Little stream',
      chargeElement,
      volume: '43.45'
    };
    beforeEach(async () => {
      chargeElement = new ChargeElement();
      result = transactionsService.mapDBToModel(dbRow, chargeElement);
    });

    test('should return a Transaction model', async () => {
      expect(result instanceof Transaction).to.be.true();
    });

    test('should have data mapped correctly', async () => {
      expect(result.id).to.equal(dbRow.billing_transaction_id);
      expect(result.status).to.equal(dbRow.status);
      expect(result.isCredit).to.equal(dbRow.is_credit);
      expect(result.authorisedDays).to.equal(dbRow.authorised_days);
      expect(result.billableDays).to.equal(dbRow.billable_days);
      expect(result.isCompensationCharge).to.be.true();
      expect(result.description).to.equal(dbRow.description);
      expect(result.volume).to.equal(43.45);
    });

    test('charge period is mapped correctly', async () => {
      expect(result.chargePeriod instanceof DateRange).to.be.true();
      expect(result.chargePeriod.startDate).to.equal(dbRow.start_date);
      expect(result.chargePeriod.endDate).to.equal(dbRow.end_date);
    });

    test('sets the chargeElement to that supplied', async () => {
      expect(result.chargeElement).to.equal(chargeElement);
    });
  });

  experiment('.saveTransactionToDB', () => {
    let invoiceLicence;

    beforeEach(async () => {
      invoiceLicence = createInvoiceLicence();
      await transactionsService.saveTransactionToDB(invoiceLicence, invoiceLicence.transactions[0]);
    });

    test('the create() method is called on the repo', async () => {
      expect(repos.billingTransactions.create.called).to.be.true();
    });

    test('an object of the correct shape is passed to the create() method of the repo', async () => {
      const [data] = repos.billingTransactions.create.lastCall.args;
      expect(data).to.be.an.object();
      expect(Object.keys(data)).to.include(['billing_invoice_licence_id',
        'charge_element_id',
        'start_date',
        'end_date',
        'abstraction_period',
        'source',
        'season',
        'loss',
        'is_credit',
        'charge_type',
        'authorised_quantity',
        'billable_quantity',
        'authorised_days',
        'billable_days',
        'description'
      ]);
    });
  });

  experiment('.mapModelToChargeModule', () => {
    let batch, invoice, invoiceLicence, transaction, result;

    beforeEach(async () => {
      batch = createBatch();
      invoice = createInvoice();
      invoiceLicence = createInvoiceLicence();
      transaction = createTransaction();
    });

    experiment('for a supplementary bill run', async () => {
      beforeEach(async () => {
        result = transactionsService.mapModelToChargeModule(batch, invoice, invoiceLicence, transaction);
      });

      test('the data is mapped correctly', async () => {
        expect(result).to.equal({
          periodStart: '01-APR-2019',
          periodEnd: '31-MAR-2020',
          credit: false,
          billableDays: 366,
          authorisedDays: 366,
          volume: 5.64,
          twoPartTariff: false,
          compensationCharge: false,
          section126Factor: 1,
          section127Agreement: false,
          section130Agreement: false,
          customerReference: 'A12345678A',
          lineDescription: 'Tiny pond',
          chargePeriod: '01-APR-2019 - 31-MAR-2020',
          batchNumber: 'd65bf89e-4a84-4f2e-8fc1-ebc5ff08c125',
          source: 'Supported',
          season: 'Summer',
          loss: 'Low',
          eiucSource: 'Other',
          chargeElementId: '29328315-9b24-473b-bde7-02c60e881501',
          waterUndertaker: true,
          regionalChargingArea: 'Anglian',
          licenceNumber: '01/123/ABC',
          region: 'A',
          areaCode: 'ARCA'
        });
      });
    });

    experiment('when the batch type is two-part tariff', () => {
      beforeEach(async () => {
        batch.type = Batch.types.twoPartTariff;
        result = transactionsService.mapModelToChargeModule(batch, invoice, invoiceLicence, transaction);
      });

      test('the twoPartTariff flag is set', async () => {
        expect(result.twoPartTariff).to.be.true();
      });
    });

    experiment('when the licence as a section 127 agreement', () => {
      beforeEach(async () => {
        const agreement = new Agreement();
        agreement.fromHash({
          code: 'S127'
        });
        transaction.agreements = [agreement];
        result = transactionsService.mapModelToChargeModule(batch, invoice, invoiceLicence, transaction);
      });

      test('the section 127 flag is set', async () => {
        expect(result.section127Agreement).to.be.true();
      });

      test('the section 130 flag is not set', async () => {
        expect(result.section130Agreement).to.be.false();
      });
    });

    experiment('when the licence as a section 130 agreement', () => {
      beforeEach(async () => {
        const agreement = new Agreement();
        agreement.fromHash({
          code: 'S130U'
        });
        transaction.agreements = [agreement];
        result = transactionsService.mapModelToChargeModule(batch, invoice, invoiceLicence, transaction);
      });

      test('the section 127 flag is not set', async () => {
        expect(result.section127Agreement).to.be.false();
      });

      test('the section 130 flag is set', async () => {
        expect(result.section130Agreement).to.be.true();
      });
    });
  });
});

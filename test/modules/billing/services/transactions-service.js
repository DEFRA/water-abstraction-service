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
const repos = require('../../../../src/lib/connectors/repos');

// Models
const ChargeModuleTransaction = require('../../../../src/lib/models/charge-module-transaction');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const DateRange = require('../../../../src/lib/models/date-range');
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
      expect(Object.keys(data)).to.include([
        'billingInvoiceLicenceId',
        'chargeElementId',
        'startDate',
        'endDate',
        'abstractionPeriod',
        'source',
        'season',
        'loss',
        'isCredit',
        'chargeType',
        'authorisedQuantity',
        'billableQuantity',
        'authorisedDays',
        'billableDays',
        'description'
      ]);
    });
  });
});

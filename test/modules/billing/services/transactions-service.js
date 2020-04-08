const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const transactionsService = require('../../../../src/modules/billing/services/transactions-service');
const repos = require('../../../../src/lib/connectors/repos');
const { logger } = require('../../../../src/logger');

// Models
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const DateRange = require('../../../../src/lib/models/date-range');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Region = require('../../../../src/lib/models/region');
const Transaction = require('../../../../src/lib/models/transaction');
const User = require('../../../../src/lib/models/user');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

const createUser = options => {
  const user = new User();
  return user.fromHash({
    id: options.id,
    emailAddress: options.emailAddress
  });
};

const createChargeElement = () => {
  const chargeElement = new ChargeElement('29328315-9b24-473b-bde7-02c60e881501');
  chargeElement.fromHash({
    source: 'supported',
    season: CHARGE_SEASON.summer,
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
  const transaction = new Transaction(options.id || '');
  transaction.fromHash({
    chargeElement: createChargeElement(),
    chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    volume: 5.64,
    twoPartTariffError: !!options.twoPartTariffError
  });

  if (options.twoPartTariffReview) {
    transaction.twoPartTariffReview = createUser(options.twoPartTariffReview);
  }
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
  beforeEach(async () => {
    sandbox.stub(repos.billingTransactions, 'create');
    sandbox.stub(repos.billingTransactions, 'update');
    sandbox.stub(repos.billingTransactions, 'delete');

    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
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

  experiment('.updateTransactionWithChargeModuleResponse', () => {
    const transactionId = uuid();
    const externalId = uuid();

    experiment('when there is a transaction ID', () => {
      beforeEach(async () => {
        await transactionsService.updateWithChargeModuleResponse(transactionId, {
          transaction: {
            id: externalId
          }
        });
      });

      test('the transaction status and external ID are updated', async () => {
        const [id, changes] = repos.billingTransactions.update.lastCall.args;
        expect(id).to.equal(transactionId);
        expect(changes).to.equal({
          externalId,
          status: 'charge_created'
        });
      });
    });

    experiment('when there is a zero charge response', () => {
      beforeEach(async () => {
        await transactionsService.updateWithChargeModuleResponse(transactionId, {
          status: 'Zero value charge calculated'
        });
      });

      test('the transaction is deleted', async () => {
        const [id] = repos.billingTransactions.delete.lastCall.args;
        expect(id).to.equal(transactionId);
      });
    });

    experiment('when there is an unrecognised response', () => {
      const response = {
        message: 'Something strange'
      };

      test('throws an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response);
          fail();
        } catch (err) {
          expect(err instanceof Error).to.be.true();
        }
      });

      test('logs an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response);
          fail();
        } catch (err) {
          const [message, error, params] = logger.error.lastCall.args;
          expect(message).to.be.a.string();
          expect(error instanceof Error).to.be.true();
          expect(params).to.equal({
            transactionId,
            response
          });
        }
      });
    });
  });

  experiment('.updateTransactionVolume', () => {
    let transactionId, transaction;

    beforeEach(async () => {
      const options = {
        id: transactionId,
        twoPartTariffError: false,
        twoPartTariffReview: { id: 1234, emailAddress: 'test@example.com' }
      };
      transaction = createTransaction(options);

      await transactionsService.updateTransactionVolume(transaction);
    });

    test('the update() method is called on the repo', () => {
      expect(repos.billingTransactions.update.called).to.be.true();
    });

    test('the transaction volume, twoPartTariffError and twoPartTariffReview are updated', () => {
      const [id, changes] = repos.billingTransactions.update.lastCall.args;
      expect(id).to.equal(transactionId);
      expect(changes).to.equal({
        volume: 5.64,
        twoPartTariffError: false,
        twoPartTariffReview: { id: 1234, emailAddress: 'test@example.com' }
      });
    });
  });
});

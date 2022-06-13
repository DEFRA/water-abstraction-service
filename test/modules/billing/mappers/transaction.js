'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const transactionMapper = require('../../../../src/modules/billing/mappers/transaction');

// Models
const Agreement = require('../../../../src/lib/models/agreement');
const Batch = require('../../../../src/lib/models/batch');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const BillingVolume = require('../../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const DateRange = require('../../../../src/lib/models/date-range');
const Region = require('../../../../src/lib/models/region');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

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
  const transaction = new Transaction();
  transaction.fromHash({
    id: '29328315-9b24-473b-bde7-02c60e881511',
    chargeElement: createChargeElement(),
    chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    volume: 5.64,
    isTwoPartSecondPartCharge: !!options.isTwoPartSecondPartCharge,
    isNewLicence: !!options.isNewLicence
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

const createChargeElementRow = () => ({
  chargeElementId: 'bf679fc9-dec9-42cd-bc32-542578be01d9',
  source: 'supported',
  season: CHARGE_SEASON.summer,
  loss: 'low',
  totalDays: 365,
  billableDays: 200,
  description: 'Tiny pond',
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 2,
  abstractionPeriodEndDay: 3,
  abstractionPeriodEndMonth: 4,
  authorisedAnnualQuantity: 24.45,
  billableAnnualQuantity: 31.5,
  purposeTertiaryDescription: 'Spray irrigation'
});

const createBatch = (type = 'supplementary') => {
  const batch = new Batch('d65bf89e-4a84-4f2e-8fc1-ebc5ff08c125');
  return batch.fromHash({ type });
};

const createAgreement = (code, factor) => {
  const agreement = new Agreement();
  agreement.code = code;
  if (factor !== undefined) {
    agreement.factor = factor;
  }
  return agreement;
};

experiment('modules/billing/mappers/transaction', () => {
  experiment('.modelToDb', () => {
    let invoiceLicence, result;

    experiment('when the transaction is a standard charge', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence();
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the result is mapped correctly', async () => {
        expect(result).to.equal({
          billingInvoiceLicenceId: 'c4fd4bf6-9565-4ff8-bdba-e49355446d7b',
          chargeElementId: '29328315-9b24-473b-bde7-02c60e881501',
          startDate: '2019-04-01',
          endDate: '2020-03-31',
          abstractionPeriod: {
            startDay: 1,
            startMonth: 1,
            endDay: 31,
            endMonth: 12
          },
          source: 'supported',
          loss: 'low',
          season: CHARGE_SEASON.summer,
          isCredit: false,
          isCreditedBack: false,
          chargeType: 'standard',
          authorisedQuantity: 12.5,
          billableQuantity: 10,
          authorisedDays: 366,
          billableDays: 366,
          description: 'Tiny pond',
          status: Transaction.statuses.candidate,
          volume: 5.64,
          section126Factor: null,
          section127Agreement: false,
          section130Agreement: null,
          isTwoPartSecondPartCharge: false,
          isNewLicence: false
        });
      });
    });

    experiment('when the transaction is a compensation charge', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the charge type is "compensation"', async () => {
        expect(result.chargeType).to.equal('compensation');
      });
    });

    experiment('when the transaction has a two-part tariff agreement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence();
        invoiceLicence.transactions[0].agreements = [createAgreement('S127')];
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section126Factor).to.equal(null);
        expect(result.section127Agreement).to.equal(true);
        expect(result.section130Agreement).to.equal(null);
      });

      test('the transaction is not a two-part tariff supplementary', async () => {
        expect(result.isTwoPartSecondPartCharge).to.equal(false);
      });
    });

    experiment('when the transaction has a two-part tariff agreement and is two-part tariff supplementary', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isTwoPartSecondPartCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S127')];
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section126Factor).to.equal(null);
        expect(result.section127Agreement).to.equal(true);
        expect(result.section130Agreement).to.equal(null);
      });

      test('the transaction is a two-part tariff supplementary', async () => {
        expect(result.isTwoPartSecondPartCharge).to.equal(true);
      });
    });

    experiment('when the transaction has a canal & rivers trust agreement agreement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S130U')];
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section126Factor).to.equal(null);
        expect(result.section127Agreement).to.equal(false);
        expect(result.section130Agreement).to.equal('S130U');
      });
    });

    experiment('when the transaction has an abatement', () => {
      beforeEach(async () => {
        invoiceLicence = createInvoiceLicence({
          isCompensationCharge: true
        });
        invoiceLicence.transactions[0].agreements = [createAgreement('S126', 0.4)];
        result = transactionMapper.modelToDb(invoiceLicence, invoiceLicence.transactions[0]);
      });

      test('the correct agreement fields are set', async () => {
        expect(result.section126Factor).to.equal(0.4);
        expect(result.section127Agreement).to.equal(false);
        expect(result.section130Agreement).to.equal(null);
      });
    });
  });

  experiment('.dbToModel', () => {
    let result;

    const dbRow = {
      billingTransactionId: '7d2c249d-0f56-40fa-90f0-fb2b7f8f698a',
      status: 'candidate',
      isCredit: false,
      authorisedDays: 365,
      billableDays: 250,
      startDate: '2019-04-01',
      endDate: '2020-03-31',
      season: 'summer',
      chargeType: 'compensation',
      description: 'Little stream',
      chargeElement: createChargeElementRow(),
      volume: '11.76',
      section126Factor: null,
      section127Agreement: false,
      section130Agreement: null,
      scheme: 'alcs'
    };
    beforeEach(async () => {
      result = transactionMapper.dbToModel(dbRow);
    });

    test('should return a Transaction model', async () => {
      expect(result instanceof Transaction).to.be.true();
    });

    test('should have data mapped correctly', async () => {
      expect(result.id).to.equal(dbRow.billingTransactionId);
      expect(result.status).to.equal(dbRow.status);
      expect(result.isCredit).to.equal(dbRow.isCredit);
      expect(result.authorisedDays).to.equal(dbRow.authorisedDays);
      expect(result.billableDays).to.equal(dbRow.billableDays);
      expect(result.isCompensationCharge).to.be.true();
      expect(result.description).to.equal(dbRow.description);
      expect(result.volume).to.equal(11.76);
    });

    test('charge period is mapped correctly', async () => {
      expect(result.chargePeriod instanceof DateRange).to.be.true();
      expect(result.chargePeriod.startDate).to.equal(dbRow.startDate);
      expect(result.chargePeriod.endDate).to.equal(dbRow.endDate);
    });

    test('sets the chargeElement to a ChargeElement instance', async () => {
      expect(result.chargeElement instanceof ChargeElement).to.be.true();
      expect(result.chargeElement.id).to.equal(dbRow.chargeElement.chargeElementId);
    });

    test('there are no agreements', async () => {
      expect(result.agreements).to.have.length(0);
    });

    test('there is no billing Volume', () => {
      expect(result.billingVolume).to.be.null();
    });

    experiment('when the DB row contains a section 126 factor', () => {
      beforeEach(async () => {
        result = transactionMapper.dbToModel({
          ...dbRow,
          section126Factor: 0.8
        });
      });

      test('the transaction includes an agreement', async () => {
        expect(result.agreements).to.have.length(1);
      });

      test('the agreement contains the right code and factor', async () => {
        expect(result.agreements[0].code).to.equal('S126');
        expect(result.agreements[0].factor).to.equal(0.8);
      });
    });

    experiment('when the DB row contains a section 127 factor', () => {
      beforeEach(async () => {
        result = transactionMapper.dbToModel({
          ...dbRow,
          section127Agreement: true
        });
      });

      test('the transaction includes an agreement', async () => {
        expect(result.agreements).to.have.length(1);
      });

      test('the agreement contains the right code', async () => {
        expect(result.agreements[0].code).to.equal('S127');
      });

      test('handles a null volume', async () => {
        result = transactionMapper.dbToModel({
          ...dbRow,
          volume: null
        });
        expect(result.volume).to.equal(null);
      });
    });

    experiment('when the DB row contains a section 130 factor', () => {
      beforeEach(async () => {
        result = transactionMapper.dbToModel({
          ...dbRow,
          section130Agreement: 'S130T'
        });
      });

      test('the transaction includes an agreement', async () => {
        expect(result.agreements).to.have.length(1);
      });

      test('the agreement contains the right code', async () => {
        expect(result.agreements[0].code).to.equal('S130T');
      });
    });

    experiment('when there are billingVolumes', () => {
      beforeEach(() => {
        result = transactionMapper.dbToModel({
          ...dbRow,
          billingVolume: [
            { billingVolumeId: '11111111-1111-1111-1111-111111111111', isSummer: true, financialYear: 2020 },
            { billingVolumeId: '22222222-2222-2222-2222-222222222222', isSummer: false, financialYear: 2020 },
            { billingVolumeId: '33333333-3333-3333-3333-333333333333', isSummer: true, financialYear: 2019 }
          ]
        });
      });

      test('the correct billing volume is selected', () => {
        expect(result.billingVolume.id).to.equal('11111111-1111-1111-1111-111111111111');
      });

      test('billing volume is mapped correctly', () => {
        expect(result.billingVolume).to.be.instanceOf(BillingVolume);
        expect(result.billingVolume.isSummer).to.be.true();
        expect(result.billingVolume.financialYear).to.be.instanceOf(FinancialYear);
        expect(result.billingVolume.financialYear.yearEnding).to.equal(2020);
      });
    });
  });

  experiment('.modelToChargeModule', () => {
    let batch, invoice, invoiceLicence, transaction, result;

    beforeEach(async () => {
      batch = createBatch();
      invoice = createInvoice();
      invoiceLicence = createInvoiceLicence();
      transaction = createTransaction();
    });

    experiment('for a supplementary bill run', () => {
      experiment('with no section 126 agreement', () => {
        beforeEach(async () => {
          result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
        });

        test('the data is mapped correctly', async () => {
          expect(result).to.equal({
            clientId: transaction.id,
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
            ruleset: 'presroc',
            licenceNumber: '01/123/ABC',
            region: 'A',
            areaCode: 'ARCA',
            subjectToMinimumCharge: true
          });
        });

        experiment('with a section 126 agreement', () => {
          beforeEach(async () => {
            const agreement = new Agreement();
            agreement.fromHash({
              code: 'S126',
              factor: 0.75
            });
            transaction.agreements = [agreement];
            result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
          });

          test('the data is mapped correctly', async () => {
            expect(result.section126Factor).to.equal(0.75);
          });
        });
        experiment('when transaction is 2PT', () => {
          beforeEach(async () => {
            transaction.isTwoPartSecondPartCharge = true;
            result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
          });

          test('the data is mapped correctly', async () => {
            expect(result.subjectToMinimumCharge).to.be.false();
          });
        });
      });
    });

    experiment('when the transaction is two-part tariff supplementary', () => {
      beforeEach(async () => {
        batch.type = Batch.BATCH_TYPE.twoPartTariff;
        transaction.isTwoPartSecondPartCharge = true;
        result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
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
        result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
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
        result = transactionMapper.modelToChargeModule(batch, invoice, invoiceLicence, transaction);
      });

      test('the section 127 flag is not set', async () => {
        expect(result.section127Agreement).to.be.false();
      });

      test('the section 130 flag is set', async () => {
        expect(result.section130Agreement).to.be.true();
      });
    });
  });

  experiment('.cmToModel', () => {
    let result;

    const cmData = {
      id: '7d2c249d-0f56-40fa-90f0-fb2b7f8f698a',
      chargeValue: 1176,
      credit: false,
      volume: 35.7,
      lineDescription: 'test transaction description',
      compensationCharge: false,
      minimumChargeAdjustment: true,
      deminimis: false,
      subjectToMinimumCharge: false
    };

    beforeEach(async () => {
      result = transactionMapper.cmToModel(cmData);
    });

    test('should return a Transaction model', async () => {
      expect(result instanceof Transaction).to.be.true();
    });

    test('should have data mapped correctly', async () => {
      expect(result.externalId).to.equal(cmData.id);
      expect(result.value).to.equal(cmData.chargeValue);
      expect(result.isCredit).to.equal(cmData.credit);
      expect(result.description).to.equal(cmData.lineDescription);
      expect(result.isCompensationCharge).to.equal(cmData.compensationCharge);
      expect(result.isMinimumCharge).to.equal(cmData.minimumChargeAdjustment);
      expect(result.isDeMinimis).to.equal(cmData.deminimis);
      expect(result.isNewLicence).to.equal(cmData.subjectToMinimumCharge);
    });
  });

  experiment('.inverseCreditNoteSign', () => {
    experiment('when the transaction is a credit note', () => {
      test('it returns a negative figure', () => {
        expect(
          transactionMapper.inverseCreditNoteSign({
            credit: true,
            chargeValue: 500
          }).chargeValue
        ).to.equal(-500);
      });
    });

    experiment('when the transaction is not a credit note', () => {
      test('it returns the original figure', () => {
        expect(
          transactionMapper.inverseCreditNoteSign({
            credit: false,
            chargeValue: 877
          }).chargeValue
        ).to.equal(877);
      });
    });
  });
});

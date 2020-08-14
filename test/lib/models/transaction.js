'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();
const { omit } = require('lodash');

const hashers = require('../../../src/lib/hash');
const Transaction = require('../../../src/lib/models/transaction');
const Agreement = require('../../../src/lib/models/agreement');
const DateRange = require('../../../src/lib/models/date-range');
const ChargeElement = require('../../../src/lib/models/charge-element');
const PurposeUse = require('../../../src/lib/models/purpose-use');
const Licence = require('../../../src/lib/models/licence');
const Region = require('../../../src/lib/models/region');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const Batch = require('../../../src/lib/models/batch');
const { CHARGE_SEASON } = require('../../../src/lib/models/constants');
const BillingVolume = require('../../../src/lib/models/billing-volume');

class TestModel {};

const getTestDataForHashing = () => {
  const region = new Region().fromHash({ code: 'A' });

  const batch = new Batch().fromHash({
    type: Batch.BATCH_TYPE.twoPartTariff,
    region
  });

  const invoiceAccount = new InvoiceAccount().fromHash({ accountNumber: 'A00000000A' });

  const licence = new Licence();
  licence.region = region;
  licence.licenceNumber = 'ABCCBA';

  const chargeElement = new ChargeElement();
  chargeElement.source = 'supported';
  chargeElement.season = CHARGE_SEASON.summer;
  chargeElement.loss = 'low';
  chargeElement.authorisedAnnualQuantity = 5;
  chargeElement.billableAnnualQuantity = null;
  chargeElement.description = 'Test description';

  const purpose = new PurposeUse();
  purpose.name = 'Test Purpose';
  chargeElement.purposeUse = purpose;

  const transaction = new Transaction();
  transaction.chargePeriod = new DateRange('2010-01-01', '2020-01-01');
  transaction.billableDays = 1;
  transaction.authorisedDays = 2;
  transaction.chargeElement = chargeElement;
  transaction.volume = 3;
  transaction.isCompensationCharge = true;
  transaction.isTwoPartTariffSupplementary = true;
  transaction.isMinimumCharge = false;

  transaction.agreements = [
    new Agreement().fromHash({ code: 'S130T' }),
    new Agreement().fromHash({ code: 'S127' }),
    new Agreement().fromHash({ code: 'S130W' })
  ];

  transaction.description = 'description';

  return { batch, invoiceAccount, licence, transaction };
};

experiment('lib/models/transaction', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('can be passed no initial values', async () => {
      const transaction = new Transaction();
      expect(transaction.id).to.be.undefined();
      expect(transaction.value).to.be.undefined();
      expect(transaction.isCredit).to.be.false();
    });

    test('can be passed an id', async () => {
      const id = uuid();
      const transaction = new Transaction(id);
      expect(transaction.id).to.equal(id);
      expect(transaction.value).to.be.undefined();
      expect(transaction.isCredit).to.be.false();
    });

    test('can be passed a value', async () => {
      const id = uuid();
      const transaction = new Transaction(id, 100);
      expect(transaction.id).to.equal(id);
      expect(transaction.value).to.equal(100);
      expect(transaction.isCredit).to.be.false();
    });

    test('can be setup as a credit', async () => {
      const id = uuid();
      const transaction = new Transaction(id, 100, true);
      expect(transaction.id).to.equal(id);
      expect(transaction.value).to.equal(100);
      expect(transaction.isCredit).to.be.true();
    });
  });

  experiment('.toCredit', () => {
    let credit, transaction;

    beforeEach(async () => {
      transaction = getTestDataForHashing().transaction;
      credit = transaction.toCredit();
    });

    test('the id is not set', async () => {
      expect(credit.id).to.be.undefined();
    });

    test('the isCredit flag is true', async () => {
      expect(credit.isCredit).to.be.true();
    });

    test('the transactions match except for the id and credit flag', async () => {
      const originalData = omit(transaction.toJSON(), ['id', 'isCredit']);
      const creditData = omit(credit.toJSON(), ['id', 'isCredit']);
      expect(originalData).to.equal(creditData);
    });
  });

  experiment('.isCredit', () => {
    test('throw an error for a non boolean value', async () => {
      const transaction = new Transaction();
      const func = () => (transaction.isCredit = '$$$');
      expect(func).to.throw();
    });
  });

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      const transaction = new Transaction();
      transaction.id = uuid();
      transaction.value = 123;
      transaction.isCredit = true;

      expect(transaction.toJSON()).to.equal({
        id: transaction.id,
        value: transaction.value,
        isCredit: transaction.isCredit,
        status: 'candidate',
        agreements: []
      });
    });
  });

  experiment('.authorisedDays', () => {
    test('can be set to a number of days in year', async () => {
      const transaction = new Transaction();
      transaction.authorisedDays = 125;
      expect(transaction.authorisedDays).to.equal(125);
    });

    test('setting to zero throws an error', async () => {
      const transaction = new Transaction();
      const func = () => {
        transaction.authorisedDays = 0;
      };
      expect(func).to.throw();
    });

    test('setting to a value >366 throws an error', async () => {
      const transaction = new Transaction();
      const func = () => {
        transaction.authorisedDays = 367;
      };
      expect(func).to.throw();
    });

    test('setting to a non-integer throws an error', async () => {
      const transaction = new Transaction();
      const func = () => {
        transaction.authorisedDays = 55.432;
      };
      expect(func).to.throw();
    });
  });

  experiment('.billableDays', () => {
    test('can be set to a number of days in year', async () => {
      const transaction = new Transaction();
      transaction.billableDays = 125;
      expect(transaction.billableDays).to.equal(125);
    });

    test('can be set to zero', async () => {
      const transaction = new Transaction();
      transaction.billableDays = 0;
      expect(transaction.billableDays).to.equal(0);
    });

    test('setting to a value >366 throws an error', async () => {
      const transaction = new Transaction();
      const func = () => {
        transaction.billableDays = 367;
      };
      expect(func).to.throw();
    });

    test('setting to a non-integer throws an error', async () => {
      const transaction = new Transaction();
      const func = () => {
        transaction.billableDays = 55.432;
      };
      expect(func).to.throw();
    });
  });

  experiment('.agreements', () => {
    let agreements;

    beforeEach(async () => {
      agreements = [
        new Agreement()
      ];
    });

    test('can set to an array of Agreement objects', async () => {
      const transaction = new Transaction();
      transaction.agreements = agreements;
      expect(transaction.agreements).to.equal(agreements);
    });

    test('throws an error if the array contains non-Agreements', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.agreements = [
          new Agreement(),
          new TestModel(),
          new Agreement()
        ];
      };

      expect(func).to.throw();
    });
  });

  experiment('.chargePeriod', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange('2019-04-01', '2020-03-31');
    });

    test('can be set to a DateRange object', async () => {
      const transaction = new Transaction();
      transaction.chargePeriod = dateRange;
      expect(transaction.chargePeriod).to.equal(dateRange);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.chargePeriod = new TestModel();
      };

      expect(func).to.throw();
    });
  });

  experiment('.isCompensationCharge', () => {
    test('can be set to a boolean', async () => {
      const transaction = new Transaction();
      transaction.isCompensationCharge = true;
      expect(transaction.isCompensationCharge).to.equal(true);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.isCompensationCharge = 'not-a-boolean';
      };

      expect(func).to.throw();
    });
  });

  experiment('.description', () => {
    const testDescription = 'Charge description';

    test('can be set to a string', async () => {
      const transaction = new Transaction();
      transaction.description = testDescription;
      expect(transaction.description).to.equal(testDescription);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.description = 1234;
      };

      expect(func).to.throw();
    });
  });

  experiment('.chargeElement', () => {
    const chargeElement = new ChargeElement();

    test('can be set to a ChargeElement instance', async () => {
      const transaction = new Transaction();
      transaction.chargeElement = chargeElement;
      expect(transaction.chargeElement).to.equal(chargeElement);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.chargeElement = new TestModel();
      };

      expect(func).to.throw();
    });
  });

  experiment('.status', () => {
    let transaction;
    beforeEach(() => {
      transaction = new Transaction();
    });
    for (const status of ['candidate', 'charge_created', 'approved', 'error']) {
      test(`can set the status to "${status}"`, async () => {
        transaction.status = status;
        expect(transaction.status).to.equal(status);
      });
    }

    test('setting status to invalid value throws an error', async () => {
      const func = () => {
        transaction.status = 'invalid-value';
      };
      expect(func).throw();
    });
  });

  experiment('.volume', () => {
    let transaction;
    beforeEach(() => {
      transaction = new Transaction();
      transaction.chargeElement = new ChargeElement();
      transaction.chargeElement.authorisedAnnualQuantity = 15;
    });
    test('can be set to a positive number', async () => {
      transaction.volume = 4.465;
      expect(transaction.volume).to.equal(4.465);
    });

    test('can be set to null', async () => {
      transaction.volume = null;
      expect(transaction.volume).to.be.null();
    });

    test('throws an error if set a negative number', async () => {
      const func = () => {
        transaction.volume = -5.34;
      };

      expect(func).to.throw();
    });

    test('throws an error if volume is greater than charge element max quantity', async () => {
      const func = () => {
        transaction.volume = 20;
      };

      expect(func).to.throw();
    });

    test('can be set to a quantity between billable and auth quantity', async () => {
      transaction.chargeElement.billableAnnualQuantity = 12;
      transaction.volume = 13;
      expect(transaction.volume).to.equal(13);
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        transaction.volume = 'a string';
      };

      expect(func).to.throw();
    });
  });

  experiment('.billingVolume', () => {
    let transaction;
    beforeEach(() => {
      transaction = new Transaction();
    });

    test('can be set to a BillingVolume instance', async () => {
      const billingVolume = new BillingVolume();
      transaction.billingVolume = billingVolume;
      expect(transaction.billingVolume).to.equal(billingVolume);
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        transaction.billingVolume = new TestModel();
      };

      expect(func).to.throw();
    });

    test('can be set to null', async () => {
      transaction.billingVolume = null;
      expect(transaction.billingVolume).to.be.null();
    });
  });

  experiment('.isMinimumCharge', () => {
    test('can be set to boolean', async () => {
      const transaction = new Transaction();
      transaction.isMinimumCharge = true;
      expect(transaction.isMinimumCharge).to.equal(true);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.isMinimumCharge = null;
      };

      expect(func).to.throw();
    });
  });

  experiment('.transactionKey', () => {
    test('can set the transaction key to a valid 32 char string', async () => {
      const transaction = new Transaction();
      const validKey = '0123456789ABCDEFFEDCBA9876543210';
      transaction.transactionKey = validKey;
      expect(transaction.transactionKey).to.equal(validKey);
    });

    test('will throw if an invalid value is set', async () => {
      const transaction = new Transaction();

      expect(() => {
        transaction.transactionKey = 'nope';
      }).to.throw();
    });
  });

  experiment('.getHashData', () => {
    test('returns a flat object containing the data to feed to the hash', () => {
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();

      const hashData = transaction.getHashData(invoiceAccount, licence, batch);

      expect(hashData.periodStart).to.equal(transaction.chargePeriod.startDate);
      expect(hashData.periodEnd).to.equal(transaction.chargePeriod.endDate);
      expect(hashData.billableDays).to.equal(transaction.billableDays);
      expect(hashData.authorisedDays).to.equal(transaction.authorisedDays);
      expect(hashData.volume).to.equal(transaction.volume);
      expect(hashData.agreements).to.equal('S127-S130T-S130W');
      expect(hashData.accountNumber).to.equal(invoiceAccount.accountNumber);
      expect(hashData.source).to.equal(transaction.chargeElement.source);
      expect(hashData.season).to.equal(transaction.chargeElement.season);
      expect(hashData.loss).to.equal(transaction.chargeElement.loss);
      expect(hashData.description).to.equal(transaction.description);
      expect(hashData.licenceNumber).to.equal(licence.licenceNumber);
      expect(hashData.regionCode).to.equal(batch.region.code);
      expect(hashData.isCompensationCharge).to.equal(transaction.isCompensationCharge);
      expect(hashData.isTwoPartTariff).to.equal(transaction.isTwoPartTariffSupplementary);
      expect(hashData.isMinimumCharge).to.equal(transaction.isMinimumCharge);
    });
  });

  experiment('.createTransactionKey', () => {
    test('sets the transactionKey value on the transaction', () => {
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      transaction.createTransactionKey(invoiceAccount, licence, batch);

      expect(transaction.transactionKey).to.equal('0218b3e845d23c82f63f471731682998');
    });

    test('returns the transactionKey', () => {
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      const transactionKey = transaction.createTransactionKey(invoiceAccount, licence, batch);

      expect(transactionKey).to.equal('0218b3e845d23c82f63f471731682998');
    });

    test('sets the value to the result of calling createMd5Hash', async () => {
      sandbox.stub(hashers, 'createMd5Hash').returns('0123456789ABCDEF0123456789ABCDEF');
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      const transactionKey = transaction.createTransactionKey(invoiceAccount, licence, batch);

      expect(transactionKey).to.equal('0123456789ABCDEF0123456789ABCDEF');
    });

    test('sorts by key for consistent behaviour', async () => {
      sandbox.stub(hashers, 'createMd5Hash');
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      transaction.createTransactionKey(invoiceAccount, licence, batch);

      const [hashInput] = hashers.createMd5Hash.lastCall.args;
      expect(hashInput.split(',')).to.equal([
        'accountNumber:A00000000A',
        'agreements:S127-S130T-S130W',
        'authorisedDays:2',
        'billableDays:1',
        'description:description',
        'isCompensationCharge:true',
        'isMinimumCharge:false',
        'isTwoPartTariff:true',
        'licenceNumber:ABCCBA',
        'loss:low',
        'periodEnd:2020-01-01',
        'periodStart:2010-01-01',
        'regionCode:A',
        'season:summer',
        'source:supported',
        'volume:3'
      ]);
    });
  });

  experiment('.isTwoPartTariffSupplementary', () => {
    test('can be set to boolean', async () => {
      const transaction = new Transaction();
      transaction.isTwoPartTariffSupplementary = true;
      expect(transaction.isTwoPartTariffSupplementary).to.equal(true);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.isTwoPartTariffSupplementary = null;
      };

      expect(func).to.throw();
    });
  });

  experiment('.createDescription', () => {
    let transaction;

    beforeEach(async () => {
      transaction = getTestDataForHashing().transaction;
    });

    experiment('when the transaction has no two-part tariff agreements', () => {
      beforeEach(async () => {
        transaction.agreements = [];
      });

      test('the standard charge description is the charge element description', async () => {
        transaction.isCompensationCharge = false;
        const description = transaction.createDescription();
        expect(description).to.equal('Test Description');
        expect(transaction.description).to.equal(description);
      });

      test('the compensation charge text is preset', async () => {
        transaction.isCompensationCharge = true;
        const description = transaction.createDescription();
        expect(description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });

      test('if the charge element has no description, the purpose use is used', async () => {
        transaction.isCompensationCharge = false;
        transaction.chargeElement.description = null;

        const description = transaction.createDescription();
        expect(description).to.equal(transaction.chargeElement.purposeUse.name);
      });
    });

    experiment('when the transaction has a two-part tariff agreement', () => {
      test('the standard charge description includes the charge element description', async () => {
        transaction.isCompensationCharge = false;
        transaction.isTwoPartTariffSupplementary = false;
        const description = transaction.createDescription();
        expect(description).to.equal('First Part Test Purpose Charge at Test Description');
        expect(transaction.description).to.equal(description);
      });

      test('the standard charge description excludes the charge element description if null', async () => {
        transaction.isCompensationCharge = false;
        transaction.isTwoPartTariffSupplementary = false;
        transaction.chargeElement.description = null;

        const description = transaction.createDescription();
        expect(description).to.equal('First Part Test Purpose Charge');
      });

      test('the compensation charge text is preset', async () => {
        transaction.isCompensationCharge = true;
        transaction.isTwoPartTariffSupplementary = false;
        const description = transaction.createDescription();
        expect(description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });

      test('the two-part tariff supplementary charge text includes the charge element description', async () => {
        transaction.isCompensationCharge = false;
        transaction.isTwoPartTariffSupplementary = true;
        const description = transaction.createDescription();
        expect(description).to.equal('Second Part Test Purpose Charge at Test Description');
      });
    });
  });
});

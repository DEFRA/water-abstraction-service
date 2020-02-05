'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const hashers = require('../../../src/lib/hash');
const ChargeModuleTransaction = require('../../../src/lib/models/charge-module-transaction');
const Transaction = require('../../../src/lib/models/transaction');
const Agreement = require('../../../src/lib/models/agreement');
const DateRange = require('../../../src/lib/models/date-range');
const ChargeElement = require('../../../src/lib/models/charge-element');
const Licence = require('../../../src/lib/models/licence');
const Region = require('../../../src/lib/models/region');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const Batch = require('../../../src/lib/models/batch');

class TestModel {};

const getTestDataForHashing = () => {
  const region = new Region().fromHash({ code: 'A' });

  const batch = new Batch().fromHash({
    type: Batch.types.twoPartTariff,
    region
  });

  const invoiceAccount = new InvoiceAccount().fromHash({ accountNumber: 'A00000000A' });

  const licence = new Licence();
  licence.region = region;
  licence.licenceNumber = 'ABCCBA';

  const chargeElement = new ChargeElement();
  chargeElement.source = 'supported';
  chargeElement.season = 'summer';
  chargeElement.loss = 'low';

  const transaction = new Transaction();
  transaction.chargePeriod = new DateRange('2010-01-01', '2020-01-01');
  transaction.billableDays = 1;
  transaction.authorisedDays = 2;
  transaction.volume = 3;
  transaction.isCompensationCharge = true;

  transaction.agreements = [
    new Agreement().fromHash({ code: 'S130T' }),
    new Agreement().fromHash({ code: 'S127' }),
    new Agreement().fromHash({ code: 'S130W' })
  ];

  transaction.chargeElement = chargeElement;
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

  experiment('.fromChargeModuleTransaction', () => {
    test('copies across the expected values', async () => {
      const chargeModuleTransaction = new ChargeModuleTransaction();
      chargeModuleTransaction.id = uuid();
      chargeModuleTransaction.value = 100;
      chargeModuleTransaction.isCredit = false;

      const transaction = Transaction.fromChargeModuleTransaction(chargeModuleTransaction);
      expect(transaction.value).to.equal(chargeModuleTransaction.value);
      expect(transaction.isCredit).to.equal(chargeModuleTransaction.isCredit);
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
      expect(hashData.isTwoPartTariff).to.equal(batch.isTwoPartTariff());
    });
  });

  experiment('.createTransactionKey', () => {
    test('sets the transactionKey value on the transaction', () => {
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      transaction.createTransactionKey(invoiceAccount, licence, batch);

      expect(transaction.transactionKey).to.equal('3b4865e9e4dba1145457e2d614c860cc');
    });

    test('returns the transactionKey', () => {
      const { batch, invoiceAccount, licence, transaction } = getTestDataForHashing();
      const transactionKey = transaction.createTransactionKey(invoiceAccount, licence, batch);

      expect(transactionKey).to.equal('3b4865e9e4dba1145457e2d614c860cc');
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
});

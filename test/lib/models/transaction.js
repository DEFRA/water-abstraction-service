'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ChargeModuleTransaction = require('../../../src/lib/models/charge-module-transaction');
const Transaction = require('../../../src/lib/models/transaction');
const Agreement = require('../../../src/lib/models/agreement');
const DateRange = require('../../../src/lib/models/date-range');
const ChargeElement = require('../../../src/lib/models/charge-element');

class TestModel {};

experiment('lib/models/transaction', () => {
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

  experiment('.isTwoPartTariffSupplementaryCharge', () => {
    test('can be set to a boolean', async () => {
      const transaction = new Transaction();
      transaction.isTwoPartTariffSupplementaryCharge = false;
      expect(transaction.isTwoPartTariffSupplementaryCharge).to.equal(false);
    });

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction();

      const func = () => {
        transaction.isTwoPartTariffSupplementaryCharge = 'not-a-boolean';
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
});

'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ChargeModuleTransaction = require('../../../src/lib/models/charge-module-transaction');
const Transaction = require('../../../src/lib/models/transaction');

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
        isCredit: transaction.isCredit
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
});

'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const ChargeModuleTransaction = require('../../../src/lib/models/charge-module-transaction');

const TEST_ACCOUNT_NUMBER = 'A12345678A';
const TEST_LICENCE_NUMBER = '123/ABC';

experiment('lib/models/charge-module-transaction', () => {
  experiment('properties', () => {
    experiment('id', () => {
      test('can be set to a uuid', async () => {
        const id = uuid();
        const transaction = new ChargeModuleTransaction();
        transaction.id = id;
        expect(transaction.id).to.equal(id);
      });

      test('throws an error if set to a non-guid string', async () => {
        const func = () => {
          const transaction = new ChargeModuleTransaction();
          transaction.id = 'nope';
        };
        expect(func).to.throw();
      });
    });

    experiment('accountNumber', () => {
      test('can be set to a valid account number', async () => {
        const transaction = new ChargeModuleTransaction();
        transaction.accountNumber = TEST_ACCOUNT_NUMBER;
        expect(transaction.accountNumber).to.equal(TEST_ACCOUNT_NUMBER);
      });

      test('throws an error if set to an invalid account number', async () => {
        const func = () => {
          const transaction = new ChargeModuleTransaction();
          transaction.accountNumber = 'nope';
        };
        expect(func).to.throw();
      });
    });

    experiment('licenceNumber', () => {
      test('can be set to a valid licence number', async () => {
        const transaction = new ChargeModuleTransaction();
        transaction.licenceNumber = TEST_LICENCE_NUMBER;
        expect(transaction.licenceNumber).to.equal(TEST_LICENCE_NUMBER);
      });

      test('throws an error if set to an invalid licence number', async () => {
        const func = () => {
          const transaction = new ChargeModuleTransaction();
          transaction.licenceNumber = 'nope';
        };
        expect(func).to.throw();
      });
    });
  });
});

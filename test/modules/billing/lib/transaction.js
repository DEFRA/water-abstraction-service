const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const transaction = require('../../../../src/modules/billing/lib/transaction');
const {
  ERR_INCORRECT_BATCH_TYPE,
  ERR_INCORRECT_BATCH_STATUS,
  ERR_INCORRECT_TRANSACTION_STATUS,
  ERR_INVALID_VOLUME
} = transaction.volumeUpdateErrors;

const Batch = require('../../../../src/lib/models/batch');
const Transaction = require('../../../../src/lib/models/transaction');
const User = require('../../../../src/lib/models/user');
const { invoice } = require('../test-data/test-batch-data');

experiment('modules/billing/lib/transaction', () => {
  let batch;
  experiment('.checkVolumeUpdateCriteriaMet', () => {
    experiment('a Boom bad request error is thrown when', () => {
      experiment('batch type', () => {
        beforeEach(() => {
          batch = new Batch();
          batch.type = Batch.BATCH_TYPE.supplementary;
          batch.addInvoice(invoice);
        });
        test('is not two part tariff', () => {
          try {
            transaction.checkVolumeUpdateCriteriaMet(batch, 20);
          } catch (error) {
            expect(error.isBoom).to.be.true();
            expect(error.output.statusCode).to.equal(400);
            expect(error.message).to.equal(ERR_INCORRECT_BATCH_TYPE);
          }
        });
      });

      experiment('batch status', () => {
        beforeEach(() => {
          batch = new Batch();
          batch.type = Batch.BATCH_TYPE.twoPartTariff;
          batch.status = Batch.BATCH_STATUS.ready;
          batch.addInvoice(invoice);
        });
        test('is not "review"', () => {
          try {
            transaction.checkVolumeUpdateCriteriaMet(batch, 20);
          } catch (error) {
            expect(error.isBoom).to.be.true();
            expect(error.output.statusCode).to.equal(400);
            expect(error.message).to.equal(ERR_INCORRECT_BATCH_STATUS);
          }
        });
      });

      experiment('transaction status', () => {
        beforeEach(() => {
          batch = new Batch();
          batch.type = Batch.BATCH_TYPE.twoPartTariff;
          batch.status = Batch.BATCH_STATUS.review;
          batch.addInvoice(invoice);
          const { invoices: [{ invoiceLicences: [{ transactions: [transaction] }] }] } = batch;
          transaction.status = Transaction.statuses.error;
        });
        test('is not "candidate"', () => {
          try {
            transaction.checkVolumeUpdateCriteriaMet(batch, 20);
          } catch (error) {
            expect(error.isBoom).to.be.true();
            expect(error.output.statusCode).to.equal(400);
            expect(error.message).to.equal(ERR_INCORRECT_TRANSACTION_STATUS);
          }
        });
      });

      experiment('volume', () => {
        beforeEach(() => {
          batch = new Batch();
          batch.type = Batch.BATCH_TYPE.twoPartTariff;
          batch.status = Batch.BATCH_STATUS.review;
          batch.addInvoice(invoice);
          const { invoices: [{ invoiceLicences: [{ transactions: [transaction] }] }] } = batch;
          transaction.status = Transaction.statuses.candidate;
        });
        test('greater than authorised quantity', () => {
          try {
            transaction.checkVolumeUpdateCriteriaMet(batch, 30);
          } catch (error) {
            expect(error.isBoom).to.be.true();
            expect(error.output.statusCode).to.equal(400);
            expect(error.message).to.equal(ERR_INVALID_VOLUME);
          }
        });
      });
    });

    experiment('does not throw an error', () => {
      beforeEach(() => {
        batch = new Batch();
        batch.type = Batch.BATCH_TYPE.twoPartTariff;
        batch.status = Batch.BATCH_STATUS.review;
        batch.addInvoice(invoice);
      });
      test('if all criteria is met', () => {
        try {
          transaction.checkVolumeUpdateCriteriaMet(batch, 20);
        } catch (error) {
          expect(error).to.be.undefined();
        }
      });
    });
  });

  experiment('.decorateTransactionWithVolume', () => {
    let reviewer, result;
    beforeEach(() => {
      batch = new Batch();
      batch.addInvoice(invoice);
      reviewer = { id: 1234, email: 'test@example.com' };

      result = transaction.decorateTransactionWithVolume(batch, 17.5, reviewer);
    });

    test('sets volume to correct value', () => {
      expect(result.volume).to.equal(17.5);
    });

    test('sets twoPartTariffError to false', () => {
      expect(result.twoPartTariffError).to.be.false();
    });

    test('twoPartTariffReview is an instance of User', () => {
      expect(result.twoPartTariffReview).to.be.instanceOf(User);
    });

    test('setstwoPartTariffReview with correct data', () => {
      const { id, emailAddress } = result.twoPartTariffReview;
      expect(id).to.equal(reviewer.id);
      expect(emailAddress).to.equal(reviewer.email);
    });
  });
});

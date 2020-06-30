'use strict';

const moment = require('moment');
const { expect } = require('@hapi/code');

const getTransactions = batch => {
  return batch.billingInvoices.reduce((transactions, invoice) => {
    return invoice.billingInvoiceLicences.reduce((transactions, licence) => {
      return [...transactions, ...licence.billingTransactions];
    }, transactions);
  }, []);
};

const assertNumberOfTransactions = (batch, chargeModuleTransactions) => {
  const batchCount = getTransactions(batch).length;
  expect(batchCount).to.equal(chargeModuleTransactions.length);
};

const assertTransactionsAreInEachSet = (batch, chargeModuleTransactions) => {
  const batchTransactions = getTransactions(batch);

  const batchExternalIds = batchTransactions.map(tx => tx.externalId);
  const chargeModuleIds = chargeModuleTransactions.map(tx => tx.id);

  const idsInBothSets = batchExternalIds.every(id => chargeModuleIds.includes(id));

  expect(idsInBothSets).to.equal(true);
};

const getTransactionPairs = (batch, chargeModuleTransactions) => {
  return getTransactions(batch).map(batchTransaction => {
    // get the corresponding charge module transaction
    const chargeModuleTransaction = chargeModuleTransactions.find(tx => tx.id === batchTransaction.externalId);

    return {
      batchTransaction,
      chargeModuleTransaction
    };
  });
};

/**
 * Takes a date in the string format YYYY-MM-DD and returns an uppercase
 * value in the format DD-MMM-YYYY
 *
 * e.g. 2000-01-01 -> 01-JAN-2000
 * @param {String} transactionDate The local date format of YYYY-MM-DD
 */
const getChargeModuleFormattedDate = transactionDate => {
  return moment(transactionDate, 'YYYY-MM-DD')
    .format('DD-MMM-YYYY')
    .toUpperCase();
};

const assertMatchingDates = (batchTransaction, chargeModuleTransaction) => {
  const formattedStart = getChargeModuleFormattedDate(batchTransaction.startDate);
  const formattedEnd = getChargeModuleFormattedDate(batchTransaction.endDate);

  expect(formattedStart).to.equal(chargeModuleTransaction.periodStart);
  expect(formattedEnd).to.equal(chargeModuleTransaction.periodEnd);
  expect(`${formattedStart} - ${formattedEnd}`).to.equal(chargeModuleTransaction.chargePeriod);
};

const assertMatchingCredit = (batchTransaction, chargeModuleTransaction) => {
  expect(batchTransaction.isCredit).to.equal(chargeModuleTransaction.credit);
};

const assertMatchingChargeElement = (batchTransaction, chargeModuleTransaction) => {
  expect(batchTransaction.loss.toLowerCase()).to.equal(chargeModuleTransaction.loss.toLowerCase());
  expect(batchTransaction.season.toLowerCase()).to.equal(chargeModuleTransaction.season.toLowerCase());
  expect(batchTransaction.source.toLowerCase()).to.equal(chargeModuleTransaction.source.toLowerCase());
  expect(batchTransaction.chargeElementId).to.equal(chargeModuleTransaction.chargeElementId);
};

const assertMatchingVolume = (batchTransaction, chargeModuleTransaction) => {
  expect(+batchTransaction.volume).to.equal(chargeModuleTransaction.volume);
};

const assertMatchingDays = (batchTransaction, chargeModuleTransaction) => {
  expect(batchTransaction.authorisedDays).to.equal(chargeModuleTransaction.authorisedDays);
  expect(batchTransaction.billableDays).to.equal(chargeModuleTransaction.billableDays);
};

const assertMatchingAgreements = (batchTransaction, chargeModuleTransaction) => {
  expect(!!batchTransaction.section127Agreement).to.equal(chargeModuleTransaction.section127Agreement);
  expect(!!batchTransaction.section130Agreement).to.equal(chargeModuleTransaction.section130Agreement);
};

const assertMatchingDescription = (batchTransaction, chargeModuleTransaction) => {
  expect(batchTransaction.description).to.equal(chargeModuleTransaction.lineDescription);
};

const assertMatchingBatchId = (batch, chargeModuleTransaction) => {
  expect(batch.billingBatchId).to.equal(chargeModuleTransaction.batchNumber);
};

const assertBatchTransactionDataExistsInChargeModule = (batch, chargeModuleTransactions) => {
  const transactionPairs = getTransactionPairs(batch, chargeModuleTransactions);

  transactionPairs.forEach(transactionPair => {
    const { batchTransaction, chargeModuleTransaction } = transactionPair;

    assertMatchingBatchId(batch, chargeModuleTransaction);

    assertMatchingChargeElement(batchTransaction, chargeModuleTransaction);
    assertMatchingDates(batchTransaction, chargeModuleTransaction);
    assertMatchingCredit(batchTransaction, chargeModuleTransaction);
    assertMatchingVolume(batchTransaction, chargeModuleTransaction);
    assertMatchingDays(batchTransaction, chargeModuleTransaction);
    assertMatchingAgreements(batchTransaction, chargeModuleTransaction);
    assertMatchingDescription(batchTransaction, chargeModuleTransaction);
  });
};

exports.assertNumberOfTransactions = assertNumberOfTransactions;
exports.assertTransactionsAreInEachSet = assertTransactionsAreInEachSet;
exports.assertBatchTransactionDataExistsInChargeModule = assertBatchTransactionDataExistsInChargeModule;

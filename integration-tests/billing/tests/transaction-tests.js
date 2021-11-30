'use strict';

const moment = require('moment');
const { expect } = require('@hapi/code');

/**
 * Extracts the transactions from the batch and adds the licence
 * and invoice data to the transactions to simplify comparisons
 * with the charge module transactions.
 *
 * @param {Object} batch
 */
const getTransactions = batch => {
  return batch.billingInvoices.reduce((transactions, invoice) => {
    return invoice.billingInvoiceLicences.reduce((transactions, licence) => {
      const augmentedTransactions = licence.billingTransactions.map(tx => {
        tx.outerData = {
          invoice,
          licence: licence.licence
        };
        return tx;
      });

      return [...transactions, ...augmentedTransactions];
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
  const isCompensationCharge = batchTransaction.chargeType === 'compensation';
  expect(isCompensationCharge).to.equal(chargeModuleTransaction.compensationCharge);

  expect(batchTransaction.isCredit).to.equal(chargeModuleTransaction.credit);
};

const assertMatchingChargeElement = (batchTransaction, chargeModuleTransaction) => {
  const expectedEiucSource = batchTransaction.source === 'tidal' ? 'tidal' : 'other';
  expect(expectedEiucSource).to.equal(chargeModuleTransaction.eiucSource.toLowerCase());

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
  expect(batchTransaction.isTwoPartSecondPartCharge).to.equal(chargeModuleTransaction.twoPartTariff);
  expect(!!batchTransaction.section127Agreement).to.equal(chargeModuleTransaction.section127Agreement);
  expect(!!batchTransaction.section130Agreement).to.equal(chargeModuleTransaction.section130Agreement);
};

const assertMatchingDescription = (batchTransaction, chargeModuleTransaction) => {
  expect(batchTransaction.description).to.equal(chargeModuleTransaction.lineDescription);
};

const assertMatchingBatchId = (batch, chargeModuleTransaction) => {
  expect(batch.billingBatchId).to.equal(chargeModuleTransaction.batchNumber);
};

const assertMatchingCustomer = (batchTransaction, chargeModuleTransaction) => {
  const { invoice } = batchTransaction.outerData;
  expect(invoice.invoiceAccountNumber).to.equal(chargeModuleTransaction.customerReference);
};

const assertMatchingLicenceData = (batchTransaction, chargeModuleTransaction) => {
  const { licence } = batchTransaction.outerData;

  expect(licence.isWaterUndertaker).to.equal(chargeModuleTransaction.waterUndertaker);
  expect(licence.licenceRef).to.equal(chargeModuleTransaction.licenceNumber);
  expect(licence.regions.regionalChargeArea).to.equal(chargeModuleTransaction.regionalChargingArea);
  expect(licence.regions.historicalAreaCode).to.equal(chargeModuleTransaction.areaCode);
  expect(licence.region.chargeRegionId).to.equal(chargeModuleTransaction.region);
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
    assertMatchingLicenceData(batchTransaction, chargeModuleTransaction);
    assertMatchingCustomer(batchTransaction, chargeModuleTransaction);
  });
};

exports.assertNumberOfTransactions = assertNumberOfTransactions;
exports.assertTransactionsAreInEachSet = assertTransactionsAreInEachSet;
exports.assertBatchTransactionDataExistsInChargeModule = assertBatchTransactionDataExistsInChargeModule;

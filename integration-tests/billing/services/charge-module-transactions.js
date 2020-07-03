'use strict';

const billRunConnector = require('../../../src/lib/connectors/charge-module/bill-runs');

const getTransactionsForBatch = async batch => {
  const response = await billRunConnector.getTransactions(batch.externalId);
  return response.data.transactions;
};

exports.getTransactionsForBatch = getTransactionsForBatch;

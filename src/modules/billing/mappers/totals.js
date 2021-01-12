'use strict';

const Totals = require('../../../lib/models/totals');

const { createMapper } = require('../../../lib/object-mapper');
const { createModel } = require('../../../lib/mappers/lib/helpers');
const { partial } = require('lodash');

const cmBillRunToBatchMapper = createMapper()
  .copy(
    'creditNoteCount',
    'creditNoteValue',
    'invoiceCount',
    'invoiceValue',
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  );

/**
   * Sums all transaction summaries for the supplied invoice account
   * number and returns as a Totals instance
   */
const cmBillRunToInvoiceMapper = createMapper()
  .copy(
    'creditLineCount',
    'creditLineValue',
    'debitLineCount',
    'debitLineValue',
    'netTotal'
  );

const cmBillRunToTotals = (mapper, data) => createModel(Totals, data, mapper);

/**
 * Maps a partial set of fields in water.billing_batches table to a Totals model
 * @param {Object} row - row of data from water.billing_batches table
 * @return {Totals}
 */
const dbToModel = row => {
  if (row.netTotal === null) {
    return null;
  }
  const totals = new Totals();
  totals.pickFrom(row, ['creditNoteCount', 'invoiceCount', 'netTotal']);
  return totals;
};

exports.chargeModuleBillRunToBatchModel = partial(cmBillRunToTotals, cmBillRunToBatchMapper);
exports.chargeModuleBillRunToInvoiceModel = partial(cmBillRunToTotals, cmBillRunToInvoiceMapper);
exports.dbToModel = dbToModel;

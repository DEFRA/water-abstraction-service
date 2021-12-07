const ChargeVersionYear = require('../../../lib/models/charge-version-year');
const FinancialYear = require('../../../lib/models/financial-year');

const batchMapper = require('./batch');
const chargeVersionMapper = require('../../../lib/mappers/charge-version');

const { createMapper } = require('../../../lib/object-mapper');
const helpers = require('../../../lib/mappers/lib/helpers');

const dbToModelMapper = createMapper()
  .copy(
    'transactionType',
    'isSummer',
    'hasTwoPartAgreement',
    'isChargeable'
  )
  .map('billingBatchChargeVersionYearId').to('id')
  .map('billingBatch').to('batch', batchMapper.dbToModel)
  .map('chargeVersion').to('chargeVersion', chargeVersionMapper.dbToModel)
  .map('financialYearEnding').to('financialYear', financialYearEnding => new FinancialYear(financialYearEnding));

/**
 * Converts DB representation to a ChargeVersionWorkflow service model
 * @param {Object} row
 * @return {ChargeVersionWorkflow}
 */
const dbToModel = row =>
  helpers.createModel(ChargeVersionYear, row, dbToModelMapper);

exports.dbToModel = dbToModel;


const Model = require('./model');
const validators = require('./validators');

const Batch = require('./batch');
const FinancialYear = require('./financial-year');
const ChargeVersion = require('./charge-version');

/**
 * Statuses that a charge version year (water.billing_batch_charge_version_years) may have. These
 * are here to help enforce that only one batch per region may
 * be run at a time.
 */
const CHARGE_VERSION_YEAR_STATUS = {
  processing: 'processing', // processing transactions
  ready: 'ready', // processing completed - awaiting approval
  error: 'error'
};

const TRANSACTION_TYPE = {
  annual: 'annual',
  twoPartTariff: 'two_part_tariff'
};

class ChargeVersionYear extends Model {
  get batch () {
    return this._batch;
  }

  set batch (batch) {
    validators.assertIsInstanceOf(batch, Batch);
    this._batch = batch;
  }

  get chargeVersion () {
    return this._chargeVersion;
  }

  set chargeVersion (chargeVersion) {
    validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
    this._chargeVersion = chargeVersion;
  }

  get financialYear () {
    return this._financialYear;
  }

  set financialYear (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear);
    this._financialYear = financialYear;
  }

  get transactionType () {
    return this._transactionType;
  }

  set transactionType (transactionType) {
    validators.assertEnum(transactionType, Object.values(TRANSACTION_TYPE));
    this._transactionType = transactionType;
  }

  get isSummer () {
    return this._isSummer;
  }

  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer);
    this._isSummer = isSummer;
  }

  get isChargeable () {
    return this._isChargeable;
  }

  set isChargeable (isChargeable) {
    validators.assertIsBoolean(isChargeable);
    this._isChargeable = isChargeable;
  }
}

module.exports = ChargeVersionYear;

module.exports.CHARGE_VERSION_YEAR_STATUS = CHARGE_VERSION_YEAR_STATUS;
module.exports.TRANSACTION_TYPE = TRANSACTION_TYPE;

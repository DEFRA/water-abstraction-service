const Joi = require('@hapi/joi');
const VALID_GUID = Joi.string().guid().required();

const FinancialYear = require('./financial-year');

class BatchChargeVersionYear {
  /**
   * Sets the GUID ID
   * @param {String} id
   */
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  /**
   * Gets the GUID ID for this batch
   * @return {String}
   */
  get id () {
    return this._id;
  }

  /**
   * Sets the billing batch GUID ID
   * @param {String} id
   */
  set billingBatchId (billingBatchId) {
    Joi.assert(billingBatchId, VALID_GUID);
    this._billingBatchId = billingBatchId;
  }

  /**
   * Gets the GUID ID for this billing batch
   * @return {String}
   */
  get billingBatchId () {
    return this._billingBatchId;
  }

  set financialYearEnding (financialYearEnding) {
    if (!(financialYearEnding instanceof FinancialYear)) {
      throw new Error('Instance of FinancialYear expected');
    }
    this._financialYearEnding = financialYearEnding;
  }

  get financialYearEnding () {
    return this._financialYearEnding;
  }
}

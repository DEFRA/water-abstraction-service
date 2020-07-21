'use strict';

const { identity } = require('lodash');

const validators = require('../../../../../lib/models/validators');
const Return = require('../../../../../lib/models/return');
const { RETURN_STATUS } = require('../../../../../lib/models/return');
const {
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE,
  ERROR_LATE_RETURNS,
  ERROR_UNDER_QUERY,
  ERROR_RECEIVED_NO_DATA,
  ERROR_NOT_DUE_FOR_BILLING
} = require('../../../../../lib/models/billing-volume').twoPartTariffStatuses;
const { getErrorIfEvery, getErrorIfSome } = require('../lib/error-handling');

// Predicates
const isDueStatus = ret => ret.status === RETURN_STATUS.due;
const isReceivedStatus = ret => ret.status === RETURN_STATUS.received;
const isLateForBilling = ret => ret.isLateForBilling;
const isUnderQuery = ret => ret.isUnderQuery;
const isNotDueForBilling = ret => !ret.isDueForBilling();

const getReturnSortKey = ret => `${ret.startDate}_${ret.id}`;

class ReturnGroup {
  /**
   * @constructor
   * @param {Array<Return>} returns
   */
  constructor (returns) {
    if (returns) {
      this.returns = returns;
    }
  }

  /**
   * Sets returns
   * @param {Array<Return>}
   */
  set returns (returns) {
    validators.assertIsArrayOfType(returns, Return);
    this._returns = returns.sort(getReturnSortKey);
  }

  /**
   * Gets the returns
   * @return {Array<Return>}
   */
  get returns () {
    return this._returns;
  }

  /**
   * Checks the returns group for errors
   * Returns a numeric code
   * @return {Number}
   */
  errorCode () {
    const errors = [
      this._returns.length === 0 ? ERROR_NO_RETURNS_FOR_MATCHING : null,
      getErrorIfEvery(this._returns, isDueStatus, ERROR_NO_RETURNS_SUBMITTED),
      getErrorIfSome(this._returns, isDueStatus, ERROR_SOME_RETURNS_DUE),
      getErrorIfSome(this._returns, isLateForBilling, ERROR_LATE_RETURNS),
      getErrorIfSome(this._returns, isUnderQuery, ERROR_UNDER_QUERY),
      getErrorIfSome(this._returns, isReceivedStatus, ERROR_RECEIVED_NO_DATA),
      getErrorIfSome(this._returns, isNotDueForBilling, ERROR_NOT_DUE_FOR_BILLING)
    ];
    return errors.filter(identity).shift();
  }
}

module.exports = ReturnGroup;

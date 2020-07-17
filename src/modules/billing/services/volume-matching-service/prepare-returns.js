'use strict';

const { groupBy, identity, mapValues, get } = require('lodash');

const validators = require('../../../../lib/models/validators');
const { RETURN_SEASONS } = require('./constants');

// Service models
const FinancialYear = require('../../../../lib/models/financial-year');
const { RETURN_STATUS } = require('../../../../lib/models/return');

const {
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE,
  ERROR_LATE_RETURNS,
  ERROR_UNDER_QUERY,
  ERROR_RECEIVED_NO_DATA
} = require('../../../../lib/models/billing-volume').twoPartTariffStatuses;

const { getErrorIfEvery, getErrorIfSome } = require('./lib/error-handling');

// Services
const returnsService = require('../../../../lib/services/returns');

/**
 * Get the season key for the returns
 * @param {Return} ret
 * @return {String}
 */
const getSeasonKey = ret => ret.isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;

// Predicates
const isDueStatus = ret => ret.status === RETURN_STATUS.due;
const isReceivedStatus = ret => ret.status === RETURN_STATUS.received;
const isLateForBilling = ret => ret.isLateForBilling;
const isUnderQuery = ret => ret.isUnderQuery;

/**
 * Returns the relevant error code depending on the returns
 * @param {Array} returns
 * @return {String|undefined}
 */
const getReturnsError = returns => {
  const errors = [
    returns.length === 0 ? ERROR_NO_RETURNS_FOR_MATCHING : null,
    getErrorIfEvery(returns, isDueStatus, ERROR_NO_RETURNS_SUBMITTED),
    getErrorIfSome(returns, isDueStatus, ERROR_SOME_RETURNS_DUE),
    getErrorIfSome(returns, isLateForBilling, ERROR_LATE_RETURNS),
    getErrorIfSome(returns, isUnderQuery, ERROR_UNDER_QUERY),
    getErrorIfSome(returns, isReceivedStatus, ERROR_RECEIVED_NO_DATA)
  ];
  return errors.filter(identity).shift();
};

/**
 * Maps a ReturnLine instance to a structure for returns matching
 * @param {ReturnLine} returnLine
 * @return {Object}
 */
const mapLine = returnLine => ({
  // Billing volumes are in ML, returns are in m3
  volume: returnLine.volume / 1000,
  allocatedVolume: 0,
  returnLine
});

/**
 * Predicate to check if the return line is not null/zero as there
 * is no need to match null/zero lines
 * @param {ReturnLine} returnLine
 * @return {Boolean}
 */
const isNotEmptyLine = returnLine => ![null, 0].includes(returnLine.volume);

const mapReturn = ret => {
  // Get return lines
  const returnLines = ret.currentReturnVersion
    .getLinesInAbstractionPeriod(ret.abstractionPeriod)
    .filter(isNotEmptyLine)
    .map(mapLine);

  return {
    ...ret.pick(['id', 'purposeUses']),
    returnLines
  };
};

const getReturns = async (licenceNumber, financialYear) => {
  validators.assertString(licenceNumber);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  const returns = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);

  // Place returns in 2 groups - one for summer and the other for winter/all year
  const returnGroups = groupBy(returns, getSeasonKey);

  return mapValues(returnGroups, returns => ({
    returns: returns.map(mapReturn),
    error: getReturnsError(returns)
  }));
};

exports.getReturns = getReturns;

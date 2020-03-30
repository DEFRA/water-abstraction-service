const Decimal = require('decimal.js-light');
const { set } = require('lodash');
const TPT_PURPOSES = [380, 390, 400, 410, 420];
const dateFormat = 'YYYY-MM-DD';
const {
  twoPartTariffStatuses: {
    ERROR_NO_RETURNS_SUBMITTED,
    ERROR_SOME_RETURNS_DUE,
    ERROR_LATE_RETURNS
  }
} = require('../../../../lib/models/transaction');

/**
 * Checks whether error is one which requires a null return
 * @param {String} error
 */
const isNullReturnRequired = error => {
  const nullReturnErrors = [ERROR_NO_RETURNS_SUBMITTED, ERROR_SOME_RETURNS_DUE, ERROR_LATE_RETURNS];
  return nullReturnErrors.includes(error);
};

/**
 * Checks whether a null return is required, otherwise returns error
 * @param {String} error
 * @param {Array} chargeElements
 */
const returnsError = (error, chargeElements) => {
  if (isNullReturnRequired(error)) return getNullActualReturnQuantities(error, chargeElements);
  return {
    error,
    data: null
  };
};

/**
 * Sets actualReturnQuantities set to null for all chargeElements
 * @param {Array} chargeElements objects
 * @return {Object}
 *         {null} error
 *         {Array} data chargeElement.id & null actualReturnQuantity
 */
const getNullActualReturnQuantities = (error, chargeElements) => {
  // @TODO: return actualReturnQuantity without adding it to charge element
  const data = chargeElements.map(element => getChargeElementReturnData(set(element, 'actualReturnQuantity', null)));
  return { error, data };
};

/**
 * Return object for matched charge element data
 * @param {Object} chargeElement
 * @param {String} error
 * @return {String} error that is passed in or null
 *         {Object} data result of matching exercise for specific charge element
 */
const getChargeElementReturnData = (chargeElement, error) => {
  const actualReturnQuantity = (chargeElement.actualReturnQuantity !== null)
    ? new Decimal(chargeElement.actualReturnQuantity).toDecimalPlaces(3).toNumber()
    : null;
  return {
    error: error || null,
    data: {
      chargeElementId: chargeElement.id,
      proRataAuthorisedQuantity: chargeElement.proRataAuthorisedQuantity,
      actualReturnQuantity
    }
  };
};

/**
 * Checks whether the return purpose matches the charge element purpose
 * @param {Object} ret return
 * @param {Object} ele charge element
 * @return {Boolean} whether or not the return contains a purpose that matches the charge element purpose
 */
const returnPurposeMatchesElementPurpose = (ret, ele) => {
  const purposeMatch = ret.metadata.purposes.map(purpose => {
    return parseInt(purpose.tertiary.code) === parseInt(ele.purposeTertiary);
  });
  return purposeMatch.includes(true);
};

exports.TPT_PURPOSES = TPT_PURPOSES;
exports.dateFormat = dateFormat;
exports.getNullActualReturnQuantities = getNullActualReturnQuantities;
exports.returnsError = returnsError;
exports.getChargeElementReturnData = getChargeElementReturnData;
exports.returnPurposeMatchesElementPurpose = returnPurposeMatchesElementPurpose;

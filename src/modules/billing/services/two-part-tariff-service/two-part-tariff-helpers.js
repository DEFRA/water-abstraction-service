const Decimal = require('decimal.js-light');
const dateFormat = 'YYYY-MM-DD';

/**
 * Sets up charge elemets with acturalReturnQuantity = null
 * @param {Array} chargeElements objects
 * @return {Object}
 *         {Integer} error passed in
 *         {Array} data chargeElement.id & null actualReturnQuantity
 */
const getNullActualReturnQuantities = (chargeElements, error) => {
  const data = chargeElements.map(element => getChargeElementReturnData(element));
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
  const actualReturnQuantity = (typeof chargeElement.actualReturnQuantity === 'number')
    ? new Decimal(chargeElement.actualReturnQuantity).toDecimalPlaces(3).toNumber()
    : null;
  return {
    error: error || null,
    data: {
      chargeElementId: chargeElement.id,
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
  const purposeMatch = ret.metadata.purposes.map(purpose =>
    parseInt(purpose.tertiary.code) === parseInt(ele.purposeUse.code));
  return purposeMatch.includes(true);
};

const getAbstractionPeriodDates = absPeriod => ({
  periodStartDay: absPeriod.startDay,
  periodStartMonth: absPeriod.startMonth,
  periodEndDay: absPeriod.endDay,
  periodEndMonth: absPeriod.endMonth
});

exports.dateFormat = dateFormat;
exports.getNullActualReturnQuantities = getNullActualReturnQuantities;
exports.getChargeElementReturnData = getChargeElementReturnData;
exports.returnPurposeMatchesElementPurpose = returnPurposeMatchesElementPurpose;
exports.getAbstractionPeriodDates = getAbstractionPeriodDates;

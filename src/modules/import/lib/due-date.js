const moment = require('moment');
const { intersection } = require('lodash');
const returnsQueries = require('./nald-returns-queries');
const { returns: { date: { getPeriodEnd } } } = require('@envage/water-abstraction-helpers');
const { mapProductionMonth } = require('./transform-returns-helpers');

/**
 * Gets the return version end date of the supplied format
 * @param {Object} format
 * @return {String|Null} date in format YYYY-MM-DD or null
 */
const getReturnVersionEndDate = format => {
  if (format.EFF_END_DATE === 'null') {
    return null;
  }
  return moment(format.EFF_END_DATE, 'DD/MM/YYYY').format('YYYY-MM-DD');
};

/**
 * Checks whether the results returned from the mod logs query contains
 * one of the relevant reason codes
 * @param  {Array}  modLogs - results from the getReturnVersionReason query
 * @return {Boolean}         true if a code is matched
 */
const isVariationCode = modLogs => {
  const eventCodes = ['VARF', 'VARM', 'AMND', 'NAME', 'REDS', 'SPAC', 'SPAN', 'XCORR'];
  const codes = modLogs.map(row => row.AMRE_CODE);
  return intersection(codes, eventCodes).length > 0;
};

/**
 * Gets the due date for the supplied cycle end date and format
 * @param  {String}  endDate - cycle end date YYYY-MM-DD
 * @param  {Object}  format  - the format object
 * @return {Promise<String>} resolved with due date YYYY-MM-DD
 */
const getDueDate = async (endDate, format) => {
  let refDate = endDate;

  const returnVersionEndDate = getReturnVersionEndDate(format);

  // If the end date of the calculated return cycle matches the end date of
  // the return version, we may have a split
  if (endDate === returnVersionEndDate) {
    // Find the mod log reason codes for the following return version
    const nextReturnVersion = parseInt(format.VERS_NO) + 1;
    const results = await returnsQueries.getReturnVersionReason(
      format.AABL_ID, format.FGAC_REGION_CODE, nextReturnVersion
    );

    // If the code matches, use the end date of the full return cycle to
    // calculate the due date
    if (isVariationCode(results)) {
      const { isSummer } = mapProductionMonth(format.FORM_PRODN_MONTH);
      refDate = getPeriodEnd(endDate, isSummer);
    }
  }

  return moment(refDate, 'YYYY-MM-DD').add(28, 'days').format('YYYY-MM-DD');
};

exports.getDueDate = getDueDate;

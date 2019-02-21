/**
 * Gets a return ID for the specified licence/format and dates
 * @param {String} regionCode The region code of the licence
 * @param {String} licenceNumber The licence ref number
 * @param {String} formatId - The id from the NALD_RET_FORMATS table row
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 */
const getReturnId = (regionCode, licenceNumber, formatId, startDate, endDate) => {
  return `v1:${regionCode}:${licenceNumber}:${formatId}:${startDate}:${endDate}`;
};

exports.getReturnId = getReturnId;

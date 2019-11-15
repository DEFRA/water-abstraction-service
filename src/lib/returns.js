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

/*
 * Parses a return ID into constituent variables
 * @param {String} returnId
 * @return {Object}
 */
const parseReturnId = (returnId) => {
  const [versionStr, regionCode, licenceNumber, formatId, startDate, endDate] = returnId.split(':');
  const version = parseFloat(versionStr.replace('v', ''));
  return { version, regionCode, licenceNumber, formatId, startDate, endDate };
};

const returnIDRegex = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

exports.returnIDRegex = returnIDRegex;
exports.getReturnId = getReturnId;
exports.parseReturnId = parseReturnId;

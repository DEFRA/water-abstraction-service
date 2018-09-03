/**
 * This layer gets return data, and depending on the date, either
 * loads data from the NALD import DB, or direct from the returns service
 */
const moment = require('moment');
const camelCase = require('camelcase');
const { mapKeys } = require('lodash');
const { fetchReturn, fetchVersion, fetchLines } = require('./api-connector');
const { isNilReturn, getLines } = require('../../import/lib/nald-returns-queries');
const { parseReturnId } = require('../../import/lib/transform-returns-helpers');
const { mapLines } = require('./transform-lines-helpers');

const getReturnData = async (returnId) => {
  let version, lines;
  const ret = await fetchReturn(returnId);

  // Whether to use new returns service - i.e. for Summer 2018 returns onwards
  const isNew = moment(ret.start_date).isSameOrAfter('2018-11-01');

  // For Summer 2018 returns onwards, use new return service
  if (isNew) {
    version = await fetchVersion(returnId);
    lines = await fetchLines(returnId, version.version_id);
  } else {
    // For older returns, synthesise data direct from the NALD import tables
    const { regionCode, formatId, startDate, endDate } = parseReturnId(returnId);

    const nilReturn = await isNilReturn(formatId, regionCode, startDate, endDate);

    version = {
      version_id: returnId,
      return_id: returnId,
      version_number: 1,
      nil_return: nilReturn
    };

    lines = [];

    const importLines = await getLines(formatId, regionCode, startDate, endDate);
    lines = mapLines(ret, importLines).map(obj => mapKeys(obj, (val, key) => camelCase(key)));
  }

  return {
    return: ret,
    version,
    lines
  };
};

module.exports = {
  getReturnData
};

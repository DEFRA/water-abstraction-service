/**
 * This layer gets return data, and depending on the date, either
 * loads data from the NALD import DB, or direct from the returns service
 */
const moment = require('moment');
const { fetchReturn, fetchVersion, fetchLines, fetchAllVersions } = require('./api-connector');
const { isNilReturn, getLines } = require('../../import/lib/nald-returns-queries');
const { parseReturnId } = require('../../import/lib/transform-returns-helpers');
const { naldToReturnLines } = require('./nald-returns-mapper');

const getReturnData = async (returnId, versionNumber) => {
  let version, lines, versions;
  const ret = await fetchReturn(returnId);

  // Whether to use new returns service - i.e. for Summer 2018 returns onwards
  const isNew = moment(ret.end_date).isSameOrAfter('2018-10-31');

  // For Summer 2018 returns onwards, use new return service
  if (isNew) {
    version = await fetchVersion(returnId, versionNumber);
    versions = await fetchAllVersions(returnId);
    lines = version ? await fetchLines(returnId, version.version_id) : [];
  } else {
    // For older returns, synthesise data direct from the NALD import tables
    const { regionCode, formatId, startDate, endDate } = parseReturnId(returnId);

    const nilReturn = await isNilReturn(formatId, regionCode, startDate, endDate);

    version = {
      version_id: returnId,
      return_id: returnId,
      version_number: 1,
      nil_return: nilReturn,
      metadata: {
        units: 'm³'
      },
      current: true
    };

    versions = [version];

    // Get lines from NALD import DB
    const naldLines = await getLines(formatId, regionCode, startDate, endDate);
    lines = naldToReturnLines(ret, naldLines);
  }

  return {
    return: ret,
    version,
    lines,
    versions
  };
};

module.exports = {
  getReturnData
};

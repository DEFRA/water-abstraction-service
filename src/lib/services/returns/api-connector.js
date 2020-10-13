'use strict';

const { first } = require('lodash');
const apiConnector = require('../../connectors/returns');

/**
 * Get all non-void returns for licence in specified return cycle
 * @param {String} licenceNumber
 * @param {Object} cycle
 */
const getReturnsForLicenceInCycle = (licenceNumber, cycle) => {
  const filter = {
    licence_ref: licenceNumber,
    status: {
      $ne: 'void'
    },
    start_date: { $gte: cycle.startDate },
    end_date: { $lte: cycle.endDate },
    'metadata->>isSummer': cycle.isSummer ? 'true' : 'false'
  };
  const sort = {
    end_date: +1,
    return_id: +1
  };
  return apiConnector.returns.findAll(filter, sort);
};

/**
 * Gets the record for the current version of the return
 * @param {String} returnId
 * @return {Promise<Object>}
 */
const getCurrentVersion = async returnId => {
  const filter = {
    return_id: returnId,
    current: true
  };
  const sort = { version_number: -1 };
  const versions = await apiConnector.versions.findAll(filter, sort);
  return first(versions);
};

/**
 * Gets the lines for the supplied version ID
 * @param {String} versionId
 * @return {Array<Object>
 */
const getLines = async versionId => {
  const filter = {
    version_id: versionId
  };
  const sort = { start_date: +1 };
  return apiConnector.lines.findAll(filter, sort);
};

/**
 * Get returns for the specified licence number with one of the supplied statuses
 * The end date of the return must be within the spefified date range
 * @param {String} licenceNumber
 * @param {Array<String>} statuses
 * @param {String} minEndDate
 * @param {String} maxEndDate
 */
const getLicenceReturnsByStatusAndEndDate = (licenceNumber, statuses, minEndDate, maxEndDate) => {
  const filter = {
    licence_ref: licenceNumber,
    status: {
      $in: statuses
    },
    end_date: { $gte: minEndDate, $lte: maxEndDate }
  };
  const sort = {
    end_date: +1,
    return_id: +1
  };
  return apiConnector.returns.findAll(filter, sort);
};

const getReturnById = async returnId => {
  const { data } = await apiConnector.returns.findOne(returnId);
  return data;
};

exports.getReturnById = getReturnById;
exports.getReturnsForLicenceInCycle = getReturnsForLicenceInCycle;
exports.getCurrentVersion = getCurrentVersion;
exports.getLines = getLines;
exports.getReturnsForLicence = apiConnector.getReturnsForLicence;
exports.getLicenceReturnsByStatusAndEndDate = getLicenceReturnsByStatusAndEndDate;

'use strict';

const { first } = require('lodash');
const apiConnector = require('../../connectors/returns');

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

exports.getCurrentVersion = getCurrentVersion;
exports.getLines = getLines;
exports.getReturnsForLicence = apiConnector.getReturnsForLicence;

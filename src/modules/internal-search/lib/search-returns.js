const { get } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const returnsService = require('../../../lib/connectors/returns');
const documents = require('../../../lib/connectors/crm/documents');
const { isReturnId } = require('./query-parser');

/**
 * Maps single return
 * @param  {Object} row - return row
 * @return {Object}     - mapped return row
 */
const mapReturn = (row) => {
  const { metadata, ...rest } = row;
  const regionCode = get(metadata, 'nald.regionCode');
  const region = helpers.regions.getRegion(regionCode);
  return {
    ...rest,
    region
  };
};

/**
 * Given an array of returns, checks each licence number
 * exists in CRM
 * This is required because we currently only show current licences, and
 * therefore we only show returns related to current licences
 * @param {Array} returns
 * @return {Promise} resolves with list of returns filtered by whether
 *                   they exist in the CRM document headers
 */
const filterReturnsByCRMDocument = async (returns) => {
  const licenceNumbers = returns.map(row => row.licence_ref);
  const filter = {
    system_external_id: {
      $in: licenceNumbers
    }
  };
  const { data, error } = await documents.findMany(filter, null, null, ['system_external_id']);

  if (error) {
    const err = new Error(`Error finding CRM document`);
    err.params = {
      error,
      licenceNumbers
    };
    throw err;
  }

  const validLicenceNumbers = data.map(row => row.system_external_id);

  return returns.filter(row => validLicenceNumbers.includes(row.licence_ref));
};

/**
 * Finds return by return ID
 * @param  {String}  returnId - the return service return ID
 * @return {Promise}          - resolves with return data
 */
const findReturnByReturnId = async (returnId) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_id: returnId
  };
  const response = await returnsService.returns.findMany(filter);
  throwIfError(response.error);
  return response.data;
};

/**
 * Creates the required params to send to the return service to get the
 * latest return for a specified format ID
 * @param {String} formatId
 * @param {String} regionCode - the NALD region code
 * @return {Object} contains filter, sort, pagination, columns
 */
const findLatestReturnByFormatId = async (formatId, regionCode) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_requirement: formatId,
    'metadata->nald->regionCode': parseInt(regionCode)
  };

  const sort = {
    end_date: -1
  };

  const pagination = {
    perPage: 1,
    page: 1
  };

  const columns = [
    'return_id', 'status', 'licence_ref', 'return_requirement', 'metadata',
    'due_date', 'end_date'
  ];

  const { data, error } = await returnsService.returns.findMany(filter, sort, pagination, columns);

  throwIfError(error);
  return data.length ? data[0] : null;
};

/**
 * Finds recent returns by format ID
 * @param  {String}  formatId - formatId - return_requirement field in returns service
 * @return {Promise}          Resolves with array of returns
 */
const findRecentReturnsByFormatId = async (formatId) => {
  const regions = [1, 2, 3, 4, 5, 6, 7, 8];
  const tasks = regions.map(regionCode => {
    return findLatestReturnByFormatId(formatId, regionCode);
  });
  const returns = await Promise.all(tasks);
  return returns.filter(x => x);
};

/**
 * Searches returns either by return ID (if detected) or format ID
 * @param  {String}  query - format ID or full return ID
 * @return {Promise}       - resolves with array of returns
 */
const searchReturns = async (query) => {
  const finder = isReturnId(query) ? findReturnByReturnId : findRecentReturnsByFormatId;
  const returns = await finder(query);
  const filtered = await filterReturnsByCRMDocument(returns);
  return filtered.map(mapReturn);
};

module.exports = {
  searchReturns
};

/**
 * A module to validate a batch of returns data sent via XML
 *
 * It performs 3 checks:
 * - CRM documents are current and registered to the supplied company entity ID
 * - returns exist in return service
 * - returns have 'due' status
 *
 * Shape of returns data:
[
  {
    "licenceNumber": "01/123/456",
    "returnRequirement": "12345678",
    "startDate": "2017-04-01",
    "endDate": "2019-02-11",
    ...
  }
]
 */

const { chunk, flatMap, find } = require('lodash');

const permit = require('../../../lib/connectors/permit');
const returns = require('../../../lib/connectors/returns');
const documents = require('../../../lib/connectors/crm/documents');

const { licence: { regimeId, typeId } } = require('../../../../config.js');

const uploadErrors = {
  ERR_PERMISSION: 'You do not have permission to submit returns for this licence',
  ERR_NOT_DUE: 'Return for this licence and date has already been sent and cannot be changed',
  ERR_NOT_FOUND: 'Dates do not match the return period'
};

/**
 * Gets an array of CRM document headers that can be submitted by the
 * supplied company entity ID
 * @param  {String} companyId - GUID for CRM company entity ID
 * @return {Promise}           resolves with array of licence numbers
 */
const getDocumentsForCompany = async (companyId) => {
  const filter = {
    company_entity_id: companyId,
    'metadata->>IsCurrent': { $ne: 'false' }
  };
  const columns = ['system_external_id'];
  const data = await documents.findAll(filter, null, columns);
  return data.map(row => row.system_external_id);
};

/**
 * Gets the NALD region codes for each licence number supplied, and returns a map
 * @param  {Array} licenceNumbers - licence numbers to check
 * @return {Promise}                resolves with map of licence numbers/regions
 */
const getLicenceRegionCodes = async (licenceNumbers) => {
  if (licenceNumbers.length === 0) {
    return {};
  }
  const filter = {
    licence_regime_id: regimeId,
    licence_type_id: typeId,
    licence_ref: {
      $in: licenceNumbers
    }
  };
  const columns = ['licence_ref', 'licence_data_value->>FGAC_REGION_CODE'];
  const data = await permit.licences.findAll(filter, null, columns);

  return data.reduce((acc, row) => {
    return {
      ...acc,
      [row.licence_ref]: parseInt(row['?column?'])
    };
  }, {});
};

/**
 * Gets expected return ID in return service based on uploaded return, and
 * the NALD region code
 * @param  {Object} ret        - single return from uploaded returns array
 * @param  {Object} regionCodes- map of NALD region codes for each licence #
 * @return {String}            - return ID
 */
const getReturnId = (ret, regionCodes) => {
  const {
    licenceNumber,
    returnRequirement,
    startDate,
    endDate
  } = ret;
  const regionCode = regionCodes[licenceNumber];
  return `v1:${regionCode}:${licenceNumber}:${returnRequirement}:${startDate}:${endDate}`;
};

/**
 * Gets an array of returns in the return service matching the
 * uploaded returns
 * @param  {Array} returnIds - an array of return IDs inferred from the upload
 * @return {Array} returns found in returns service
 */
const getReturns = (returnIds) => {
  const filter = {
    return_id: {
      $in: returnIds
    },
    status: {
      $ne: 'void'
    },
    end_date: {
      $gte: '2018-10-31'
    },
    'metadata->>isCurrent': 'true'
  };

  const columns = ['return_id', 'status'];

  return returns.returns.findAll(filter, null, columns);
};

/**
 * Formats return with errors array
 * @param  {Object} ret - the return object from uploaded data
 * @param  {String} [msg] - error message
 * @return {Object} return decorated with errors array
 */
const formatReturn = (ret, msg) => {
  return {
    ...ret,
    errors: msg ? [msg] : []
  };
};

const isNotDue = ret => ret.status !== 'due';

/**
 * Validates a single return
 * Checks that:
 * - the licence number exists in the supplied array of licence numbers
 * - a return exists in the returns service
 * - the return has a 'due' status
 *
 * @param  {Object} ret     - return object from uploaded data
 * @param  {Object} context - context data for validation checks
 * @param  {Object} context.licenceNumbers - array of valid licence numbers
 * @param  {Object} context.regionCodes - map of licence numbers / NALD region codes
 * @param  {Object} context.returns - returns found in return service
 * @return {Object} return object decorated with errors array
 */
const validateReturn = (ret, context) => {
  const { licenceNumbers, regionCodes, returns } = context;

  // Licence number not in list of CRM docs
  if (!licenceNumbers.includes(ret.licenceNumber)) {
    return formatReturn(ret, uploadErrors.ERR_PERMISSION);
  }

  // Find matching return in returns service
  const returnId = getReturnId(ret, regionCodes);
  const match = find(returns, row => row.return_id === returnId);

  // No matching return found
  if (!match) {
    return formatReturn(ret, uploadErrors.ERR_NOT_FOUND);
  }

  // Match found, but the return is not `due` status
  if (isNotDue(match)) {
    return formatReturn(ret, uploadErrors.ERR_NOT_DUE);
  }

  // All OK
  return formatReturn(ret);
};

/**
 * Validates the supplied batch of returns
 * @param  {Array} uploadedReturns- an array of uploaded returns
 * @param  {Array} licenceNumbers - an array of licence numbers registered
 *                                  to current company
 * @return {Promise}                array of returns with errors[] added
 */
const validateBatch = async (uploadedReturns, licenceNumbers) => {
  // Get a map of region codes for each licence number
  const regionCodes = await getLicenceRegionCodes(licenceNumbers);

  // Get returns from returns service based on uploaded return
  const returnIds = uploadedReturns.map(row => {
    return getReturnId(row, regionCodes);
  });
  const returns = await getReturns(returnIds);

  return uploadedReturns.map(ret => {
    const context = {
      licenceNumbers,
      regionCodes,
      returns
    };

    return validateReturn(ret, context);
  });
};

/**
 * Batch processes an array of data through func, combining the results of
 * each batch back into a flat array
 * @param  {Array}  arr     - the array of data to process
 * @param {Number} batchSize - number of array items to process per batch
 * @param  {Function}  iteratee  - the async batch handling function
 * @param  {Array}  params - additional params to pass to func
 * @return {Promise}        - resolves with result of batch process
 */
const batchProcess = async (arr, batchSize, iteratee, ...params) => {
  const batches = chunk(arr, batchSize);
  const tasks = batches.map(batch => iteratee(batch, ...params));
  const results = await Promise.all(tasks);
  return flatMap(results);
};

/**
 * Divides uploaded returns into batches of 100 and validates each batch
 * @param  {Array} returns   - uploaded returns data
 * @param  {String} companyId - GUID CRM company entity ID
 * @return {Promise}          - resolves with each return having errors array
 */
const validate = async (returns, companyId) => {
  const licenceNumbers = await getDocumentsForCompany(companyId);
  return batchProcess(returns, 100, validateBatch, licenceNumbers);
};

module.exports = {
  getDocumentsForCompany,
  getLicenceRegionCodes,
  getReturnId,
  getReturns,
  validate,
  batchProcess,
  uploadErrors
};

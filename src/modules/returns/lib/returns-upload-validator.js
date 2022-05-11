/**
 * A module to validate a batch of returns data sent via XML
 *
 * It performs 4 checks:
 * - Current CRM documents exist for the licence number in the return
 * - CRM documents are registered to the supplied company entity ID
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
const { chunk, flatMap, find, uniq, cond, negate, get, isEqual, pick } = require('lodash');

const returnsConnector = require('../../../lib/connectors/returns');
const documents = require('../../../lib/connectors/crm/documents');

const returnLines = require('@envage/water-abstraction-helpers').returns.lines;

const schema = require('../schema.js');

const uploadErrors = {
  ERR_LICENCE_NOT_FOUND: 'The licence number could not be found',
  ERR_PERMISSION: 'You do not have permission to submit returns for this licence',
  ERR_NOT_DUE: 'This return has already been completed',
  ERR_NOT_FOUND: 'The return dates or reference do not match our records',
  ERR_VOLUMES: 'The volumes must be a positive number',
  ERR_METER_DETAILS: 'You must provide the manufacturer and serial number of the water meter',
  ERR_LINES: 'You have entered data into a field marked "Do not edit"',
  ERR_SCHEMA: 'The selected file must use the template',
  ERR_DATE_FORMAT: 'The dates in the first column must have the same format'
};

/**
 * Get all current CRM documents for the supplied batch of returns
 * from the CRM
 * @param  {Array} returns   - a list of all returns
 * @return {Promise}           resolves with array of CRM documents
 */
const getDocuments = (returns) => {
  const licenceNumbers = uniq(returns.map(row => row.licenceNumber));
  const filter = {
    'metadata->>IsCurrent': { $ne: 'false' },
    system_external_id: {
      $in: licenceNumbers
    }
  };
  // Sort is required for multi-page result set to be stable
  const sort = {
    system_external_id: +1
  };
  const columns = ['system_external_id', 'company_entity_id'];
  return documents.findAll(filter, sort, columns);
};

/**
 * Gets a filter object which can be passed to lodash find to find a
 * CRM document with the specified licence number
 * @param  {String} licenceNumber - the licence number to find
 * @return {Object} filter object
 */
const getDocumentFilter = licenceNumber => ({
  system_external_id: licenceNumber
});

/**
 * Gets a filter object which can be passed to lodash find to find a
 * CRM document with the specified licence number and company ID
 * @param  {String} licenceNumber - the licence number to find
 * @param {String} companyId - CRM company entity GUID
 * @return {Object} filter object
 */
const getCompanyDocumentFilter = (licenceNumber, companyId) => ({
  system_external_id: licenceNumber,
  company_entity_id: companyId
});

/**
 * Gets only those properties from a return line that are relevant
 * to determine the date range/time period for comparison
 *
 * @param {Object} line
 * @return {Object}
 */
const getLineDateRange = line => pick(line, ['startDate', 'endDate', 'timePeriod']);

/**
 * Checks that the return lines in the uploaded data match those calculated
 * from the return header
 *
 * @param {Object} ret - return upload object
 * @param {Object} context
 * @param {Array<Object>} context.returns
 * @return {boolean}     - true if return lines OK or nil return
 */
const validateReturnlines = (ret, context) => {
  if (ret.isNil) {
    return true;
  }

  // Generate required lines specified by return header
  const header = find(context.returns, { return_id: ret.returnId });
  const requiredLines = returnLines.getRequiredLines(
    header.start_date,
    header.end_date,
    header.returns_frequency
  );

  // Check if the supplied return lines are identical to those in header
  return isEqual(
    requiredLines.map(getLineDateRange),
    ret.lines.map(getLineDateRange)
  );
};

/**
 * Checks that the return frequency is as consistent with expectations
 * @param  {Object} ret - return upload object
 * @return {boolean}     - true if return lines OK or nil return
 */
const validateLineFrequency = ret => {
  if (ret.isNil) {
    return true;
  }
  // if first date line has an invalid date format, frequency won't exist and the
  // following code will throw an error which surfaces in the UI
  try {
    const { startDate, endDate, frequency } = ret;
    const requiredLines = returnLines.getRequiredLines(startDate, endDate, frequency);
    const returnTimePeriod = uniq(ret.lines.map(line => line.timePeriod));
    return isEqual(returnTimePeriod, [requiredLines[0].timePeriod]);
  } catch (err) {
    return false;
  }
};

/**
 * Checks that a CRM document for the licence number in the return was found
 * @param  {Object} ret     - uploaded return
 * @param  {Object} context - additional context data
 * @return {Boolean}         true if document was found
 */
const validateLicence = (ret, context) =>
  find(context.documents, getDocumentFilter(ret.licenceNumber));

/**
 * Checks that the user's company matches that of the CRM document
 * @param  {Object} ret     - uploaded return
 * @param  {Object} context - additional context data
 * @return {Boolean}         true if company matches
 */
const validatePermission = (ret, context) =>
  find(context.documents, getCompanyDocumentFilter(ret.licenceNumber, context.companyId));

/**
 * Checks a return was found in the returns service for the uploaded return ID
 * @param  {Object} ret     - uploaded return
 * @param  {Object} context - additional context data
 * @return {Boolean}         true if return found
 */
const validateReturnExists = (ret, context) =>
  find(context.returns, { return_id: ret.returnId });

/**
 * Checks the return in the return service has 'due' status
 * @param  {Object} ret     - uploaded return
 * @param  {Object} context - additional context data
 * @return {Boolean}         true if return is due
 */
const validateReturnDue = (ret, context) => {
  const match = find(context.returns, { return_id: ret.returnId });
  return get(match, 'status') === 'due';
};

/**
 * Checks that the JSON in the uploaded return passes Joi schema validation
 * @param  {Object} ret     - uploaded return
 * @param  {Object} context - additional context data
 * @return {Boolean}         true if schema passes
 */
const validateReturnSchema = (ret, context) => {
  const { error } = schema.returnSchema.validate(ret);
  return !error;
};

const validateAbstractionVolumes = (ret, context) => {
  if (ret.isNil) return true;
  const linesWithIssues = ret.lines.filter(line => {
    return !(line.quantity === null || line.quantity >= 0);
  });
  return linesWithIssues.length === 0;
};

const validateMeterDetails = (ret, context) => {
  if (ret.isNil || ret.meters.length === 0) return true;
  return (ret.meters[0].manufacturer !== '' && ret.meters[0].serialNumber !== '');
};

/**
 * Creates a pair for use in the lodash cond function, in the form:
 * [predicate, func]
 * @param  {Function} predicate
 * @param  {String} error - error message
 * @return {Array} [predicate, func]
 */
const createPair = (predicate, error) => {
  return [negate(predicate), () => error];
};

/**
 * Creates a validator which returns an error message for the first validation
 * test that fails
 * @type {Function}
 */
const validator = cond([
  createPair(validateLicence, uploadErrors.ERR_LICENCE_NOT_FOUND),
  createPair(validatePermission, uploadErrors.ERR_PERMISSION),
  createPair(validateReturnExists, uploadErrors.ERR_NOT_FOUND),
  createPair(validateReturnDue, uploadErrors.ERR_NOT_DUE),
  createPair(validateAbstractionVolumes, uploadErrors.ERR_VOLUMES),
  createPair(validateMeterDetails, uploadErrors.ERR_METER_DETAILS),
  createPair(validateLineFrequency, uploadErrors.ERR_DATE_FORMAT),
  createPair(validateReturnlines, uploadErrors.ERR_LINES),
  createPair(validateReturnSchema, uploadErrors.ERR_SCHEMA)
]);

/**
 * Validates a single return
 * Checks that:
 * - the licence number exists in the supplied array of licence numbers
 * - a return exists in the returns service
 * - the return has a 'due' status
 *
 * @param  {Object} ret     - return object from uploaded data
 * @param  {Object} context - context data for validation checks
 * @param  {Object} context.documents - array of CRM documents found
 * @param  {Object} context.returns - returns found in return service
 * @param {String} context.companyId - the CRM company entity ID for current user
 * @return {Object} return object decorated with errors array
 */
const validateReturn = (ret, context) => {
  const error = context.validate ? validator(ret, context) : null;

  return {
    ...ret,
    errors: error ? [error] : []
  };
};

/**
 * Validates the supplied batch of returns
 * @param  {Array} uploadedReturns- an array of uploaded returns
 * @param  {Array} licenceNumbers - an array of licence numbers registered
 *                                  to current company
 * @return {Promise}                array of returns with errors[] added
 */
const validateBatch = async (uploadedReturns, context) => {
  const returnIds = uploadedReturns.map(ret => ret.returnId);
  const returns = await returnsConnector.getActiveReturns(returnIds);

  return uploadedReturns.map(ret => {
    return validateReturn(ret, {
      ...context,
      returns
    });
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
const validate = async (returns, companyId, validateJson = false) => {
  const documents = validate ? await getDocuments(returns) : [];
  const context = {
    companyId,
    documents,
    validateJson
  };
  return batchProcess(returns, 100, validateBatch, context);
};

exports.validate = validate;
exports.batchProcess = batchProcess;
exports.uploadErrors = uploadErrors;
exports.getDocuments = getDocuments;

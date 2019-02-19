const s3 = require('../../../lib/connectors/s3');

const uploadStatus = {
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  ERROR: 'error',
  SUBMITTING: 'submitting',
  SUBMITTED: 'submitted'
};

/**
 * Gets the location of the file in the S3 bucket
 * where a returns document would be saved
 * @param eventId
 * @param fileExtension Defaults to xml
 * @returns {string}
 */
const getUploadFilename = (eventId, fileExtension = 'xml') => {
  const folder = 'returns-upload';
  return `${folder}/${eventId}.${fileExtension}`;
};

const getReturnsS3Object = (eventId, fileExtension = 'xml') => {
  const key = getUploadFilename(eventId, fileExtension);
  return s3.getObject(key);
};

/**
 * Extracts the JSON from an S3 object
 *
 * @param {Object} s3Object The S3 object containing the JSON
 * @returns {Object} S3 body parsed as JSON
 */
const s3ObjectToJson = s3Object => JSON.parse(s3Object.Body.toString());

/**
 * buildJobData
 *
 * @param {string} eventId The event id
 * @param {string} subType='xml' The return upload sub type (default to xml)
 * @returns {Object} The object containing the required job data
 */
const buildJobData = (eventId, subType = 'xml') => ({ eventId, subType });

exports.uploadStatus = uploadStatus;
exports.getUploadFilename = getUploadFilename;
exports.getReturnsS3Object = getReturnsS3Object;
exports.buildJobData = buildJobData;
exports.s3ObjectToJson = s3ObjectToJson;

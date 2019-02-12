const s3 = require('../../../lib/connectors/s3');

const uploadStatus = {
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  ERROR: 'error'
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

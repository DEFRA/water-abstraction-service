const s3 = require('../../../lib/services/s3');

const uploadStatus = {
  PROCESSING: 'processing',
  VALIDATED: 'validated',
  READY: 'ready',
  ERROR: 'error',
  SUBMITTING: 'submitting',
  SUBMITTED: 'submitted'
};

/**
 * Gets the location of the file in the S3 bucket
 * where the charge information csv would be saved
 * @param event
 * @param type
 * @returns {string}
 */
const getUploadFilename = (event, type) => {
  let { filename } = event.metadata;
  if (type) {
    filename = `${filename.split('.')[0]}.${type}`;
  }

  const folder = 'charge-version-upload';
  return `${folder}/${event.id}/${filename}`;
};

/**
 * Gets the location of the file in the S3 bucket
 * where the charge information error csv would be saved
 * @param event
 * @param type
 * @returns {string}
 */
const getUploadErrorFilename = (event, type) => getUploadFilename(event, type).replace('.csv', '-errors.csv');

const getChargeInformationS3Object = (event, type) => {
  const key = getUploadFilename(event, type);
  return s3.getObject(key);
};

const getChargeInformationErrorsS3Object = (event, type) => {
  const key = getUploadErrorFilename(event, type);
  return s3.getObject(key);
};

/**
 * Extracts the JSON from an S3 object
 *
 * @param {Object} s3Object The S3 object containing the JSON
 * @returns {Object} S3 body parsed as JSON
 */
const s3ObjectToJson = s3Object => JSON.parse(s3Object.Body.toString());

exports.uploadStatus = uploadStatus;
exports.getUploadFilename = getUploadFilename;
exports.getUploadErrorFilename = getUploadErrorFilename;
exports.getChargeInformationS3Object = getChargeInformationS3Object;
exports.getChargeInformationErrorsS3Object = getChargeInformationErrorsS3Object;
exports.s3ObjectToJson = s3ObjectToJson;

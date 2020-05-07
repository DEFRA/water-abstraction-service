const path = require('path');
const s3 = require('../../../lib/services/s3');
const constants = require('../lib/constants');

const s3Path = path.join(constants.S3_IMPORT_PATH, constants.S3_IMPORT_FILE);
const localPath = path.join(constants.LOCAL_TEMP_PATH, constants.S3_IMPORT_FILE);

/**
 * Gets the ETag of the current NALD zip in the S3 bucket
 * This is a hash of the file contents which can be used
 * to detect changes
 * @return {Promise<String>}
 */
const getEtag = async () => {
  const result = await s3.getHead(s3Path);
  return result.ETag.replace(/"/g, '');
};

/**
 * Downloads latest ZIP file from S3 bucket
 * @return {Promise} resolves when download complete
 */
const download = async () => {
  return s3.download(s3Path, localPath);
};

exports.getEtag = getEtag;
exports.download = download;

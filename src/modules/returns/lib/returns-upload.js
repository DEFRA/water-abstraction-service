const uploadStatus = {
  PROCESSING: 'processing',
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

exports.uploadStatus = uploadStatus;
exports.getUploadFilename = getUploadFilename;

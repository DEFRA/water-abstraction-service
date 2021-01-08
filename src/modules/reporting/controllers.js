const s3 = require('../../lib/services/s3');

const getReport = async (request) => {
  const { reportIdentifier } = request.params;
  const response = await s3.getSignedUrl(`reporting/${reportIdentifier}.csv`);
  return response;
};

exports.getReport = getReport;

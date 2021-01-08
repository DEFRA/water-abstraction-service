const s3 = require('../../lib/services/s3');

const getReport = (request) => {
  const { reportIdentifier } = request.params;
  return s3.getSignedUrl(`reporting/${reportIdentifier}.csv`);
};

exports.getReport = getReport;

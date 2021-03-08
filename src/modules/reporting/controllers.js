const s3 = require('../../lib/services/s3');

const getReport = async (request) => {
  const { reportIdentifier } = request.params;
  const url = await s3.getSignedUrl(`reporting/${reportIdentifier}.csv`, 'getObject', 45);
  return {
    data: {
      url
    }
  };
};

exports.getReport = getReport;

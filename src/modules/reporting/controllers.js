const reportsConnector = require('../../lib/connectors/reporting/');

const getReport = async (request) => reportsConnector.getReport(request.params.reportIdentifier);

exports.getReport = getReport;

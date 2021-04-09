const reportsConnector = require('../../lib/connectors/reporting/');

const getReport = request => reportsConnector.getReport(request.params.reportIdentifier);

exports.getReport = getReport;

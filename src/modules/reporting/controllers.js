const reportsConnector = require('../../lib/connectors/reporting/');

/**
 * Requests a report from the Reporting microservice
 * @param request {Object} The request object
 * @returns {Request} Request body
 */
const getReport = request => reportsConnector.getReport(request);

exports.getReport = getReport;

'use strict';
const config = require('../../../../config');
const urlJoin = require('url-join');
const got = require('got');

/**
 * Requests a report from the Reporting microservice
 * @param request {Object} The request object
 * @returns {Request} Got Request - Streams file from S3
 */
const getReport = request => {
  const key = request.params.reportIdentifier;
  const uri = urlJoin(config.services.reporting, 'report', key);
  const options = {
    headers: {
      Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      'defra-internal-user-id': request.defra.userId
    }
  };

  return got.stream(uri, options);
};

exports.getReport = getReport;

'use strict'
const config = require('../../../../config')
const urlJoin = require('url-join')
const got = require('got')

/**
 * Requests a report from the Reporting microservice
 * @param userId {string} The user number
 * @param reportIdentifier {string} The report identifier
 * @returns {Request} Got Request - Streams file from S3
 */
const getReport = (userId, reportIdentifier) => {
  const uri = urlJoin(config.services.reporting, 'report', reportIdentifier)
  const options = {
    headers: {
      Authorization: `Bearer ${process.env.JWT_TOKEN}`,
      'defra-internal-user-id': `${userId}`
    }
  }

  return got.stream(uri, options)
}

exports.getReport = getReport

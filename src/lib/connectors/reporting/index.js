'use strict';

const config = require('../../../../config');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const urlJoin = require('url-join');

/**
 * Posts to import module to re-import charging data
 * @return {Promise}
 */
const getReport = key => {
  const uri = urlJoin(config.services.reporting, 'report', key);
  return serviceRequest.get(uri);
};

exports.getReport = getReport;

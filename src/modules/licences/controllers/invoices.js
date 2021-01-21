'use strict';
const Boom = require('@hapi/boom');
const licencesService = require('../../../lib/services/licences');
const { logger } = require('../../../logger');

const getLicenceInvoices = async request => {
  const { licenceId } = request.params;
  const { page, perPage } = request.query;
  try {
    return licencesService.getLicenceInvoices(licenceId, page, perPage);
  } catch (error) {
    logger.error('Failed to get bills for licence', error, { licenceId });
    return Boom.boomify(error);
  }
};

exports.getLicenceInvoices = getLicenceInvoices;

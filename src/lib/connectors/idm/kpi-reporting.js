'use-strict';

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const getKPIRegistrations = () => {
  const url = `${config.services.idm}/kpi/registrations`;
  return serviceRequest.get(url);
};

exports.getKPIRegistrations = getKPIRegistrations;

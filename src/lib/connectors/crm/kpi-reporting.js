'use strict';

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const getKPIAccessRequests = () => {
  const url = `${config.services.crm}/kpi/access-requests`;
  return serviceRequest.get(url);
};

exports.getKPIAccessRequests = getKPIAccessRequests;

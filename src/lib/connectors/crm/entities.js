const { serviceRequest } = require('@envage/water-abstraction-helpers');
const { partialRight } = require('lodash');
const config = require('../../../../config');

const getEntityContent = async (entityId, pathTail) => {
  const url = `${config.services.crm}/entity/${entityId}/${pathTail}`;
  return serviceRequest.get(url);
};

const getEntityCompanies = partialRight(getEntityContent, 'companies');

const getEntityVerifications = partialRight(getEntityContent, 'verifications');

module.exports = {
  getEntityCompanies,
  getEntityVerifications
};

const serviceRequest = require('../service-request');
const { partialRight } = require('lodash');

const getEntityContent = async (entityId, pathTail) => {
  const url = `${process.env.CRM_URI}/entity/${entityId}/${pathTail}`;
  return serviceRequest.get(url);
};

const getEntityCompanies = partialRight(getEntityContent, 'companies');

const getEntityVerifications = partialRight(getEntityContent, 'verifications');

module.exports = {
  getEntityCompanies,
  getEntityVerifications
};

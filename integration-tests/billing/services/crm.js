'use strict';

const { serviceRequest } = require('@envage/water-abstraction-helpers');

const config = require('../../../config');

const data = require('./data');

/**
 * Entity cache used to temporarily store CRM entities
 * @type {Object}
 */
const entityCache = {
  companies: {}
};

/**
 * Creates a company in the CRM
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const createCompany = async scenarioKey => {
  const uri = `${config.services.crm_v2}/companies`;
  const options = {
    body: {
      ...data.companies[scenarioKey],
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates company in CRM or retrieves from cache
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const getOrCreateCompany = async scenarioKey => {
  if (!(scenarioKey in entityCache.companies)) {
    entityCache.companies[scenarioKey] = await createCompany(scenarioKey);
  }
  return entityCache.companies[scenarioKey];
};

/**
 * Clears the entity cache
 */
const clearEntityCache = () => {
  entityCache.companies = {};
};

/**
 * Tears down data in CRM and clears entity cache
 * @return {Promise}
 */
const tearDown = async () => {
  clearEntityCache();
  const uri = `${config.services.crm_v2}/test-data`;
  return serviceRequest.delete(uri);
};

exports.getOrCreateCompany = getOrCreateCompany;
exports.tearDown = tearDown;

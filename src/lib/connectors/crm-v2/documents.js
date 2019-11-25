const urlJoin = require('url-join');
const Joi = require('joi');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

const basePath = config.services.crm.replace('/1.0', '/2.0');

const VALID_LICENCE_NUMBER = Joi.string().required().example('01/123/R01');
const VALID_GUID = Joi.string().guid().required();

/**
 * Get a list of documents for the given licence number
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocuments = licenceNumber => {
  Joi.assert(licenceNumber, VALID_LICENCE_NUMBER);
  const uri = urlJoin(basePath, '/documents');
  return serviceRequest.get(uri, {
    qs: {
      documentRef: licenceNumber,
      regime: 'water',
      documentType: 'abstraction_licence'
    }
  });
};

/**
 * Get a single document with its roles for given document ID
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocument = documentId => {
  Joi.assert(documentId, VALID_GUID);
  const uri = urlJoin(basePath, '/documents/', documentId);
  return serviceRequest.get(uri);
};

exports.getDocuments = getDocuments;
exports.getDocument = getDocument;

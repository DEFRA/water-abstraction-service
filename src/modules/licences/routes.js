const Joi = require('joi');
const controller = require('./controller');
const { version } = require('../../../config');

module.exports = {

  getUpdateLicence: {
    method: 'GET',
    path: `/water/${version}/documents/{documentId}/licence`,
    handler: controller.getLicenceByDocumentId,
    config: {
      description: 'Returns the full licence for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        }
      }
    }
  }
};

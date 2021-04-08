const controllers = require('./controllers');
const Joi = require('@hapi/joi');
const { ROLES: { billing } } = require('../../lib/roles');

module.exports = {
  getReport: {
    path: '/water/1.0/report/{reportIdentifier}',
    method: 'GET',
    handler: controllers.getReport,
    options: {
      description: 'Fetches a CSV reports stored in S3',
      auth: {
        scope: [billing]
      },
      validate: {
        params: {
          reportIdentifier: Joi.string().valid(
            'billedActiveLicencesReport',
            'uncreditedInactiveLicencesReport',
            'unbilledActiveLicencesReport'
          ).required()
        },
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        }
      }
    }
  }
};

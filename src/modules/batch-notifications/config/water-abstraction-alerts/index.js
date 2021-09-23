const Joi = require('joi');
const { getRecipients } = require('./lib/get-recipients');
const eventHelpers = require('../../lib/event-helpers');

const schema = Joi.object().keys({
  linkages: Joi.array().items(
    Joi.array().items(
      Joi.object().keys({
        licenceGaugingStationId: Joi.string().uuid(),
        licenceId: Joi.string().uuid(),
        abstractionPeriodStartDay: Joi.number(),
        abstractionPeriodStartMonth: Joi.number(),
        abstractionPeriodEndDay: Joi.number(),
        abstractionPeriodEndMonth: Joi.number(),
        restrictionType: Joi.string(),
        alertType: Joi.string(),
        thresholdValue: Joi.string(),
        thresholdUnit: Joi.string(),
        licenceVersionPurposeConditionId: Joi.string().uuid(),
        licenceRef: Joi.string(),
        label: Joi.string()
      })
    ))
});

module.exports = [{
  prefix: 'WAA-',
  name: 'Water abstraction alert',
  messageType: 'waterAbstractionAlerts',
  schema,
  getRecipients,
  createEvent: eventHelpers.createEvent
}];

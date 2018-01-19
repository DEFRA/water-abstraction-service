/**
 *
 * @module controllers/notify
 */

const DB = require('../lib/connectors/db');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyClient = new NotifyClient(process.env.NOTIFY_KEY);
const Joi = require('joi');


/**
 * Gets the notify template ID for a notify message ref,
 * and sends it using the notify API
 *
 *  Sample CURL
 *  curl -X POST '../notify/password_reset_email' -d '{"recipient":"email@email.com","personalisation":{"firstname":"name","reset_url":"url"}}'
 *
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.recipient] - recipient of the notify message
 * @param {String} [request.query.message_type] - the type of message to be sent - email|letter|sms
 * @param {String} [request.query.message_ref] - the internal ref of the message to be sent
 * @param {String} [request.payload.personalisation] - the personalisation packet
 * @param {Object} reply - the HAPI HTTP response
 */
async function send(request, reply) {
  var data = {};
  data.message_ref = request.params.message_ref
  data.recipient = request.payload.recipient
  data.personalisation = request.payload.personalisation
  data.config = request.payload.config

  const schema = {
    message_ref: Joi.string().required(),
    recipient: Joi.string().required(),
    personalisation: Joi.object().required(),
    config: Joi.object(),
  };
  const {
    error,
    value
  } = Joi.validate(data, schema);
  if (error) {
    throw ({
      error: error.details
    });
  } else {
    //Send ${data.message_ref} to ${data.recipient} with ${data.personalisation}`
    try {

      //get template details
      template = await DB.query('select * from water.notify_templates where message_ref=$1', [data.message_ref])
      if (!template.data.length == 1) {
        return reply(`Template ${data.message_ref} was not found`).code(500)
      } else {
        var template_id = template.data[0].template_id
        try {
          //check template exists in notify
          var template = await notifyClient.getTemplateById(template_id)
        } catch (e) {
          return reply({
            error: 'Error returned from notify',
            message_ref: data.message_ref,
            template_id: template_id || 'Not found',
            message: e.message
          }).code(500)
        }
        //call different notify functions according to template type as returned by notify
        switch (template.body.type) {
          case 'sms':
            try {
              var res = await notifyClient.sendSms(template_id, data.recipient, data.personalisation)
            } catch (e) {
              return reply({
                error: 'Error returned from notify',
                message_ref: data.message_ref,
                template_id: template_id || 'Not found',
                message: e.message
              }).code(500)
            }
            break;
          case 'email':
            try {
              var res = await notifyClient.sendEmail(template_id, data.recipient, data.personalisation)
            } catch (e) {
              return reply({
                error: 'Error returned from notify',
                message_ref: data.message_ref,
                template_id: template_id || 'Not found',
                message: e.message
              }).code(500)
            }
            break;
          case 'letter':
            try {
              var res = await notifyClient.sendLetter(template_id, data.personalisation)
            } catch (e) {
              return reply({
                error: 'Error returned from notify',
                message_ref: data.message_ref,
                template_id: template_id || 'Not found',
                message: e.message
              }).code(500)
            }
            break;
          default:
            throw `Unknown template type ${template.body.type}`
            return reply({
              error: 'Unsupported template type',
              message_ref: data.message_ref,
              template_id: template_id || 'Not found'
            }).code(500)
        }
      }
      return reply({message:'ok'}).code(200)

    } catch (e) {
      return reply(e).code(500)
    }



  }




}



module.exports = {
  send,
}

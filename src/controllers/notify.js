/**
 *
 * @module controllers/notify
 */

const Helpers = require('../lib/helpers');
const DB = require('../lib/connectors/db');
const NotifyClient = require('notifications-node-client').NotifyClient;

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
 * @param {String} [request.query.message_ref] - the internal ref of the message to be sent
 * @param {String} [request.payload.personalisation] - the personalisation packet
 * @param {Object} reply - the HAPI HTTP response
 */
async function send(request, reply) {
  var config = {};
  config.message_ref = request.params.message_ref
  config.recipient = request.payload.recipient
  config.personalisation = request.payload.personalisation

  res = await sendNow(config)

  if (res.error) {
    return reply({
      error
    }).code(500)
  } else {
    return reply({
      message
    }).code(200)
  }

}




/**
 * Gets the notify template ID for a notify message ref,
 * and sends it using the notify API
 *
 *  Sample CURL
 *  curl -X POST '../notify/password_reset_email' -d '{"recipient":"email@email.com","personalisation":{"firstname":"name","reset_url":"url"}}'
 *
 * @param {Object} config - the request
 * @param {String} [config.id] - id of the notify request (used for preventing double send with on conflict)
 * @param {String} [config.recipient] - recipient of the notify message
 * @param {String} [config.message_ref] - the internal ref of the message to be sent
 * @param {String} [config.personalisation] - the personalisation packet
 */
async function sendNow(config) {
  console.log('sending now')
  console.log(config)
  const schema = {
    message_ref: Joi.string().required(),
    recipient: Joi.string().required(),
    personalisation: Joi.object().required(),
  };
  const {
    error,
    value
  } = Joi.validate(config, schema);
  if (error) {
    throw ({
      error: error.details
    });
  } else {
    //Send ${data.message_ref} to ${data.recipient} with ${data.personalisation}`

    try {
      console.log('get the templates')
      //get template details
      template = await DB.query('select * from water.notify_templates where message_ref=$1', [config.message_ref])
      console.log(template)
      if (!template.data || !template.data.length == 1) {
        console.log('template not found')
        return {          error: `Template ${config.message_ref} was not found`        }
      } else {
        const notifyClient = new NotifyClient(template.data[0].notify_key);
        var template_id = template.data[0].template_id
        try {
          //check template exists in notify
          var template = await notifyClient.getTemplateById(template_id)
        } catch (e) {
          return {
            error: {              error: 'Error returned from notify',              message_ref: config.message_ref,              template_id: template_id || 'Not found',              message: e.message            }
          }
        }
        //call different notify functions according to template type as returned by notify
        switch (template.body.type) {
          case 'sms':
            try {
              var res = await notifyClient.sendSms(template_id, config.recipient, config.personalisation)
            } catch (e) {
              return {
                error: {
                  error: 'Error returned from notify',
                  message_ref: data.message_ref,
                  template_id: template_id || 'Not found',
                  message: e.message
                }
              }
            }
            break;
          case 'email':
            try {
              var res = await notifyClient.sendEmail(template_id, config.recipient, config.personalisation)
              console.log(res.body)
            } catch (e) {
              return {
                error: {
                  error: 'Error returned from notify',
                  message_ref: config.message_ref,
                  template_id: template_id || 'Not found',
                  message: e.message
                }
              }
            }
            break;
          case 'letter':
            try {
              if ((process.env.NODE_ENV || '').match(/^production|preprod$/i)) {
                console.log('sending live letter')
                await notifyClient.sendLetter(templateID, config.personalisation)
              } else {
                console.log('sending test letter')
                const notifyClient = new NotifyClient(process.env.TEST_NOTIFY_KEY);
                await notifyClient.sendLetter(templateID, config.personalisation)
              }
            } catch (e) {
              return {
                error: {
                  error: 'Error returned from notify',
                  message_ref: config.message_ref,
                  template_id: template_id || 'Not found',
                  message: e.message
                }
              }
            }
            break;
          default:
            throw `Unknown template type ${template.body.type}`
            return {
              error: {
                error: 'Unsupported template type',
                message_ref: config.message_ref,
                template_id: template_id || 'Not found',
                message: e.message
              }
            }
        }
      }
      console.log('SUCCESS!')
      return {        message: 'ok'      }

    } catch (e) {
      console.log('ERROR!')
      console.log(e)
      return {        error: e      }
    }
  }

}


/**
 * Gets the notify template ID for a notify message ref,
 * and sends it using the notify API
 *
 *  Sample CURL
 *  curl -X POST '../notify/password_reset_email' -d '{"recipient":"email@email.com","personalisation":{"firstname":"name","reset_url":"url"}}'
 *
 * @param {Object} config - the request
 * @param {String} [config.id] - id of the notify request (used for preventing double send with on conflict)
 * @param {String} [config.recipient] - recipient of the notify message
 * @param {String} [config.message_ref] - the internal ref of the message to be sent
 * @param {String} [config.personalisation] - the personalisation packet
 * @param {String} [config.sendafter] - date time of when to send
 */
async function sendLater(config) {
  const schema = {
    id: Joi.string().required(),
    recipient: Joi.string().required(),
    message_ref: Joi.string().required(),
    personalisation: Joi.object().required(),
    sendafter: Joi.string().required(),
  };
  const {
    error,
    value
  } = Joi.validate(config, schema);
  if (error) {
    console.log('validation fail')
    console.log(error.details)
    throw ({
      error: error.details
    });
  } else {
    const query = `insert into water.scheduled_notification (id,recipient,message_ref,personalisation,send_after)
    values ($1,$2,$3,$4,$5) on conflict(id) do nothing`
    const queryparams = [config.id, config.recipient, config.message_ref, config.personalisation, config.sendafter]
    try {
      const addNotification = await DB.query(query, queryparams)
      return ({
        message: 'ok'
      })
    } catch (e) {
      console.log(e)
      return ({
        message: e
      })
    }
  }
}


module.exports = {
  send,
  sendNow,
  sendLater
}

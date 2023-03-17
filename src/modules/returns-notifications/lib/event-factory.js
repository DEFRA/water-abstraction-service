'use strict'

const Joi = require('joi')
const evt = require('../../../lib/event')

/**
 * Gets licence numbers from list of returns
 * @param {Array} returns - list of returns from returns service
 * @return {Array} unique list of affected licence numbers
 */
const getLicenceNumbers = (returns) => {
  const licenceNumbers = returns.map(row => row.licence_ref)
  return [...new Set(licenceNumbers)]
}

const getReturnIds = (returns) => {
  return returns.map(row => row.return_id)
}

/**
 * Schema for eventFactory options
 */
const schema = {
  issuer: Joi.string().email().required(),
  messageRef: Joi.string().required(),
  ref: Joi.string().required(),
  name: Joi.string().required()
}

/**
 * Create event for logging sent notification
 * @param {String} options.issuer - the email address of person issuing notification
 * @param {String} options.messageRef - the template reference, e.g. pdf.return-form
 * @param {String} options.ref - unique reference for this batch of messages
 * @param {String} options.name - friendly name for this message, e.g. 'reminder'

 * @param {Array} returns - list of returns
 * @param {String} ref - unique reference for this batch
 * @param {String} name - a friendly name for this type of notification
 */
function eventFactory (options, returns) {
  const { error, value } = schema.validate(options)
  if (error) {
    throw error
  }

  const { issuer, messageRef, ref, name } = value

  // Create array of affected licence numbers
  const licences = getLicenceNumbers(returns)

  return evt.create({
    referenceCode: ref,
    type: 'notification',
    subtype: messageRef,
    issuer,
    licences,
    metadata: {
      name: `Returns: ${name}`,
      returnIds: getReturnIds(returns),
      recipients: returns.length,
      pending: returns.length,
      sent: 0,
      error: 0
    },
    status: 'sending'
  })
}

module.exports = eventFactory

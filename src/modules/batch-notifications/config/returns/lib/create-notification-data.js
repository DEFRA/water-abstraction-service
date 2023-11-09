'use strict'

const { v4: uuid } = require('uuid')

const { MESSAGE_STATUS_DRAFT } = require('../../../lib/message-statuses')
const notifyHelpers = require('../../../lib/notify-helpers')

const waterHelpers = require('@envage/water-abstraction-helpers')

const { isoToReadable } = waterHelpers.nald.dates
const {
  CONTACT_ROLE_PRIMARY_USER, CONTACT_ROLE_RETURNS_AGENT,
  CONTACT_ROLE_LICENCE_HOLDER, CONTACT_ROLE_RETURNS_TO
} = require('../../../../../lib/models/contact')

/**
 * Gets personalisation data for the notification - this relates to the
 * dates of the most recent completed return cycle
 * @param  {String} refDate - used for unit testing, sets todays date
 * @return {Object}         - start, end and due dates of return cycle
 */
const getReturnPersonalisation = evt => {
  const { startDate, endDate, dueDate } = evt.metadata.returnCycle

  return {
    periodStartDate: isoToReadable(startDate),
    periodEndDate: isoToReadable(endDate),
    returnDueDate: isoToReadable(dueDate)
  }
}

/**
 * Creates notification object fields that are common to all message types
 * @param  {Object} ev      - the event object
 * @param  {Object} contact - the Contact model
 * @param  {Object} context - additional context
 * @param {Array} context.licenceNumbers - licences this notification relates to
 * @param {Array} context.returnIds - returns this notification relates to
 * @return {Object}         - scheduled_notification data
 */
const createNotification = (ev, contact, context) => ({
  id: uuid(),
  event_id: ev.id,
  licences: context.licenceNumbers,
  metadata: {
    returnIds: context.returnIds
  },
  status: MESSAGE_STATUS_DRAFT
})

/**
 * Creates email notification data with the supplied message ref
 * @param  {Object} ev      - the event object
 * @param  {Object} contact - the Contact model
 * @param  {Object} context - additional context
 * @param {Array} context.licenceNumbers - licences this notification relates to
 * @param {Array} context.returnIds - returns this notification relates to
 * @param {String} messageRef - the message ref in the config.js file
 * @return {Object}         - scheduled_notification data
 */
const createEmail = (ev, contact, context, messageRef) => ({
  ...createNotification(ev, contact, context),
  message_type: 'email',
  message_ref: messageRef,
  recipient: contact.email,
  personalisation: getReturnPersonalisation(ev)
})

/**
 * Creates letter notification data with the supplied message ref
 * @param  {Object} ev      - the event object
 * @param  {Object} contact - the Contact model
 * @param  {Object} context - additional context
 * @param {Array} context.licenceNumbers - licences this notification relates to
 * @param {Array} context.returnIds - returns this notification relates to
 * @param {String} messageRef - the message ref in the config.js file
 * @return {Object}         - scheduled_notification data
 */
const createLetter = (ev, contact, context, messageRef) => ({
  ...createNotification(ev, contact, context),
  message_type: 'letter',
  message_ref: messageRef,
  recipient: 'n/a',
  personalisation: {
    ...getReturnPersonalisation(ev),
    name: contact.getFullName(),
    ...notifyHelpers.mapContactAddress(contact)
  }
})

const emailTemplate = template => ({ method: createEmail, messageRef: template })
const letterTemplate = template => ({ method: createLetter, messageRef: template })

/**
 * Maps the message type and contact role to the relevant factory method and
 * message ref
 * @type {Object}
 */
const templateMap = {
  returnInvitation: {
    [CONTACT_ROLE_PRIMARY_USER]: emailTemplate('returns_invitation_primary_user_email'),
    [CONTACT_ROLE_RETURNS_AGENT]: emailTemplate('returns_invitation_returns_agent_email'),
    [CONTACT_ROLE_LICENCE_HOLDER]: letterTemplate('returns_invitation_licence_holder_letter'),
    [CONTACT_ROLE_RETURNS_TO]: letterTemplate('returns_invitation_returns_to_letter')
  },
  returnReminder: {
    [CONTACT_ROLE_PRIMARY_USER]: emailTemplate('returns_reminder_primary_user_email'),
    [CONTACT_ROLE_RETURNS_AGENT]: emailTemplate('returns_reminder_returns_agent_email'),
    [CONTACT_ROLE_LICENCE_HOLDER]: letterTemplate('returns_reminder_licence_holder_letter'),
    [CONTACT_ROLE_RETURNS_TO]: letterTemplate('returns_reminder_returns_to_letter')
  }
}

/**
 * Creates the notification data to write in the
 * water.scheduled_notification table
 * @param  {Object} ev      - the event object
 * @param  {Object} contact - the Contact model
 * @param  {Object} context - additional context
 * @param {Array} context.licenceNumbers - licences this notification relates to
 * @param {Array} context.returnIds - returns this notification relates to
 * @param {String} messageRef - the message ref in the config.js file
 * @return {Object}         - scheduled_notification data
 */
const createNotificationData = async (ev, contact, context) => {
  const { method, messageRef } = templateMap[ev.subtype][contact.role]

  return method(ev, contact, context, messageRef)
}

exports._getReturnPersonalisation = getReturnPersonalisation
exports.createNotificationData = createNotificationData

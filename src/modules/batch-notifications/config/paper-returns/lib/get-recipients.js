'use strict'

const { logger } = require('../../../../../logger')
const returnsService = require('../../../../../lib/services/returns/api-connector')
const ScheduledNotification = require('../../../../../lib/models/scheduled-notification')
const scheduledNotificationService = require('../../../../../lib/services/scheduled-notifications')
const eventHelpers = require('../../../lib/event-helpers')
const sendBatch = require('../../../lib/send-batch')

const addressMapper = require('../../../../../lib/mappers/address')
const contactMapper = require('../../../../../lib/mappers/contact')
const companyMapper = require('../../../../../lib/mappers/company')
const notifyMapper = require('../../../../../lib/mappers/notify')

const getReturnPersonalisation = ret => {
  const metadata = ret.metadata || {}
  const nald = metadata.nald || {}

  return {
    area_code: nald.areaCode,
    due_date: ret.due_date,
    end_date: ret.end_date,
    format_id: nald.formatId,
    is_two_part_tariff: metadata.isTwoPartTariff,
    licence_ref: ret.licence_ref,
    purpose: metadata.purposes.map(p => p.tertiary.description).join(', '),
    qr_url: ret.return_id,
    region_code: nald.regionCode,
    returns_frequency: ret.returns_frequency,
    site_description: metadata.description,
    start_date: ret.start_date
  }
}

const getPersonalisationsForReturn = (company, address, contact, ret) => {
  return {
    ...notifyMapper.mapModelsToNotifyAddress({ address, company, contact }),
    ...getReturnPersonalisation(ret)
  }
}

const mapServiceModels = form => {
  try {
    return {
      company: companyMapper.pojoToModel(form.company),
      address: addressMapper.pojoToModel(form.address),
      contact: contactMapper.pojoToModel(form.contact)
    }
  } catch (err) {
    logger.error('Failed to map return form contact to service models', form)
    throw err
  }
}

const getPersonalisationsForForm = async form => {
  const personalisations = []
  const { returns } = form

  const { company, address, contact } = mapServiceModels(form)

  const returnIds = returns.map(ret => ret.returnId)

  for (const returnId of returnIds) {
    const fullReturn = await returnsService.getReturnById(returnId)
    const personalisation = getPersonalisationsForReturn(company, address, contact, fullReturn)
    personalisations.push(personalisation)
  }

  return personalisations
}

const getRecipients = async (eventData) => {
  // the event data was written to the events table by the
  // createEvent function of the config object. Therefore the
  // data that was included in the post body is found at
  // eventData.ev.metadata.options and will have the shape:
  // {
  //   forms: [
  //     {
  //       company: {},
  //       address: {},
  //       contact: {},
  //       returns: [{ returnId: "" }]
  //     }
  //   ]
  // }
  //
  // so for each of the returns a scheduled notification is created
  // containing the personalisation object that will allow the form
  // to be rendered.
  const event = eventData.ev
  const { forms } = event.metadata.options

  let recipientCount = 0
  const licenceNumbers = []

  for (const form of forms) {
    const personalisations = await getPersonalisationsForForm(form)

    for (const personalisation of personalisations) {
      const notification = new ScheduledNotification()
      notification.personalisation = personalisation
      notification.messageRef = 'pdf.return_form'
      notification.messageType = 'letter'
      notification.eventId = event.id
      notification.licences = [personalisation.licence_ref]

      await scheduledNotificationService.createScheduledNotification(notification)

      recipientCount++
      licenceNumbers.push(personalisation.licence_ref)
    }
  }

  // Update event status to 'processed'
  await eventHelpers.markAsProcessed(event.id, licenceNumbers, recipientCount)

  // Send immediately without user confirmation
  await sendBatch.send(event.id, event.issuer)
}

exports.getRecipients = getRecipients

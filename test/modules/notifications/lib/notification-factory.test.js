const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const notificationFactory = require('../../../../src/modules/notifications/lib/notification-factory.js')

experiment('modules/notifications/lib/notification-factory.js', () => {
  let taskConfig, contactData, event

  beforeEach(async () => {
    taskConfig = {
      config: {
        subject: 'Message subject'
      }
    }

    contactData = {
      contact: {
        contact: {
          salutation: 'Mr',
          forename: 'John',
          name: 'Doe',
          postcode: 'TT1 1TT',
          address_1: 'Buttercup Farm',
          address_2: 'Daisy meadow',
          address_3: 'Oak avenue',
          address_4: 'Windy ridge',
          town: 'Testington',
          county: 'Testingshire',
          email: 'test@example.com',
          entity_id: 'test-entity-id'
        },
        licences: [{
          system_external_id: '01/123/ABC',
          company_entity_id: 'test-company-id'
        }],
        method: 'email'
      },
      output: 'Message body'
    }

    event = {
      eventId: 'test-event-id'
    }
  })

  experiment('when the message is an email', () => {
    let result

    beforeEach(async () => {
      result = await notificationFactory(contactData, taskConfig, event)
    })

    test('the message type is notification_email', async () => {
      expect(result.messageRef).to.equal('notification_email')
    })

    test('the recipient is the email address', async () => {
      expect(result.recipient).to.equal('test@example.com')
    })

    test('the personalisation includes the message subject, body and header', async () => {
      expect(result.personalisation.body).to.equal(contactData.output)
      expect(result.personalisation.heading).to.equal(taskConfig.config.subject)
      expect(result.personalisation.subject).to.equal(taskConfig.config.subject)
    })

    test('the licence numbers are set', async () => {
      expect(result.licences).to.equal(['01/123/ABC'])
    })

    test('the event ID is set', async () => {
      expect(result.eventId).to.equal(event.eventId)
    })

    test('the entity IDs are set', async () => {
      expect(result.companyEntityId).to.equal(contactData.contact.licences[0].company_entity_id)
      expect(result.individualEntityId).to.equal(contactData.contact.contact.entity_id)
    })
  })

  experiment('when the message is a letter', () => {
    let result

    beforeEach(async () => {
      contactData.contact.method = 'letter'
      contactData.contact.contact.email = null
      result = await notificationFactory(contactData, taskConfig, event)
    })

    test('the message type is notification_letter', async () => {
      expect(result.messageRef).to.equal('notification_letter')
    })

    test('the address is set correctly', async () => {
      const { personalisation } = result
      expect(personalisation.address_line_1).to.equal('Mr John Doe')
      expect(personalisation.address_line_2).to.equal('Buttercup Farm')
      expect(personalisation.address_line_3).to.equal('Daisy meadow')
      expect(personalisation.address_line_4).to.equal('Oak avenue')
      expect(personalisation.address_line_5).to.equal('Windy ridge')
      expect(personalisation.address_line_6).to.equal('Testington')
      expect(personalisation.postcode).to.equal('TT1 1TT')
    })

    test('the address does not include more than 6 lines, as this is not supported in Notify', async () => {
      const { personalisation } = result
      expect(personalisation).to.not.include('address_line_7')
    })
  })

  experiment('when address lines are null', () => {
    let result

    beforeEach(async () => {
      contactData.contact.method = 'letter'
      contactData.contact.contact.email = null
      contactData.contact.contact.address_3 = null
      contactData.contact.contact.address_4 = null
      result = await notificationFactory(contactData, taskConfig, event)
    })

    test('the address is set correctly', async () => {
      const { personalisation } = result
      expect(personalisation.address_line_1).to.equal('Mr John Doe')
      expect(personalisation.address_line_2).to.equal('Buttercup Farm')
      expect(personalisation.address_line_3).to.equal('Daisy meadow')
      expect(personalisation.address_line_4).to.equal('Testington')
      expect(personalisation.address_line_5).to.equal('Testingshire')

      expect(personalisation.postcode).to.equal('TT1 1TT')
    })

    test('the address does not include more than 5 lines, as empty lines are removed', async () => {
      const { personalisation } = result
      expect(personalisation).to.not.include('address_line_6')
    })
  })
})

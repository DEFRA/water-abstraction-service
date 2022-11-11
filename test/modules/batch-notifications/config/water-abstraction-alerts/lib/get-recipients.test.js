const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const { logger } = require('../../../../../../src/logger')
const { getRecipients } =
  require('../../../../../../src/modules/batch-notifications/config/water-abstraction-alerts/lib/get-recipients')
const scheduledNotificationsService = require('../../../../../../src/lib/services/scheduled-notifications')
const eventHelpers =
  require('../../../../../../src/modules/batch-notifications/lib/event-helpers')

const crmV2Connector = require('../../../../../../src/lib/connectors/crm-v2')

const licenceGaugingStationConnector = require('../../../../../../src/lib/connectors/repos/licence-gauging-stations')

const lvpcConnector = require('../../../../../../src/lib/connectors/repos/licence-version-purpose-conditions')

const gaugingStationConnector = require('../../../../../../src/lib/connectors/repos/gauging-stations')

experiment('getRecipients', () => {
  const addressId = uuid()
  const companyId = uuid()
  const contactId = uuid()
  const licenceVersionPurposeConditionId = uuid()
  const licenceGaugingStationId = uuid()
  const jobData = {
    ev: {
      id: uuid(),
      subtype: 'waterAbstractionAlerts',
      issuer: 'crumpets@defra.gov.uk',
      metadata: {
        name: 'Water abstraction alert',
        options: {
          linkages: [
            [{
              alertType: 'stop',
              licenceRef: 'AN/123',
              licenceGaugingStationId,
              restrictionType: 'stop',
              label: 'Gurney FS',
              thresholdValue: 500,
              thresholdUnit: 'Beavers per second'
            }]
          ],
          sendingAlertType: 'stop'
        }
      }
    }
  }

  beforeEach(async () => {
    sandbox.stub(crmV2Connector.documents, 'getDocumentByRefAndDate').resolves({
      addressId,
      companyId,
      contactId
    })
    sandbox.stub(crmV2Connector.addresses, 'getAddress').resolves({
      address1: 'ADDRESS1',
      address2: 'ADDRESS2',
      address3: 'ADDRESS3',
      address4: 'ADDRESS4',
      town: 'TOWN',
      county: 'COUNTY',
      postcode: 'POSTCODE',
      country: 'COUNTRY'
    })
    sandbox.stub(crmV2Connector.companies, 'getCompany').resolves()
    sandbox.stub(crmV2Connector.companies, 'getCompanyWAAEmailContacts').resolves([])
    sandbox.stub(crmV2Connector.contacts, 'getContact').resolves()
    sandbox.stub(gaugingStationConnector, 'findOneByLinkageId').resolves({
      riverName: 'Avon',
      label: 'Gurney FS'
    })
    sandbox.stub(scheduledNotificationsService, 'createScheduledNotification').resolves({})
    sandbox.stub(licenceGaugingStationConnector, 'findOneById').resolves({
      licenceVersionPurposeConditionId
    })
    sandbox.stub(lvpcConnector, 'findOneById').resolves({})
    sandbox.stub(licenceGaugingStationConnector, 'updateStatus').resolves()
    sandbox.stub(eventHelpers, 'markAsProcessed')
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('for letters', () => {
    test('finds each relevant document if there is a document Id', async () => {
      await getRecipients(jobData)
      expect(crmV2Connector.documents.getDocumentByRefAndDate.callCount).to.equal(jobData.ev.metadata.options.linkages.length)
    })

    test('finds each relevant contact', async () => {
      await getRecipients(jobData)
      expect(crmV2Connector.contacts.getContact.callCount).to.equal(jobData.ev.metadata.options.linkages.length)
    })

    test('doesnt try to find each relevant contact if there is no contact Id for a given row', async () => {
      crmV2Connector.documents.getDocumentByRefAndDate.resolves({
        contactId: undefined
      })
      await getRecipients(jobData)
      expect(crmV2Connector.contacts.getContact.callCount).to.equal(0)
    })

    test('finds each relevant company', async () => {
      await getRecipients(jobData)
      expect(crmV2Connector.companies.getCompany.callCount).to.equal(jobData.ev.metadata.options.linkages.length)
    })

    test('doesnt try to find each relevant company if there is no company Id for a given row', async () => {
      crmV2Connector.documents.getDocumentByRefAndDate.resolves({
        companyId: undefined
      })
      await getRecipients(jobData)
      expect(crmV2Connector.companies.getCompany.callCount).to.equal(0)
    })

    test('finds each relevant address', async () => {
      await getRecipients(jobData)
      expect(crmV2Connector.addresses.getAddress.callCount).to.equal(jobData.ev.metadata.options.linkages.length)
    })

    test('doesnt try to find each relevant address if there is no address Id for a given row', async () => {
      crmV2Connector.documents.getDocumentByRefAndDate.resolves({
        addressId: undefined
      })
      await getRecipients(jobData)
      expect(crmV2Connector.addresses.getAddress.callCount).to.equal(0)
    })

    test('schedules a message for each de-duped contact', async () => {
      await getRecipients(jobData)
      expect(scheduledNotificationsService.createScheduledNotification.callCount).to.equal(1)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(Object.keys(row)).to.only.include([
        '_messageRef',
        '_eventId',
        '_licences',
        '_messageType',
        '_personalisation']
      )
    })

    test('sends a stop alert to a licence if it has a stop threshold and its a stop alert being issued', async () => {
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_stop')
    })

    test('sends a reduce alert to a licence if it has a reduce threshold and its a reduce alert being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'reduce'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'reduce'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_reduce')
    })

    test('sends a reduce or stop alert to a licence if it has a reduce or stop threshold and its a reduce alert being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'reduce'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'stop_or_reduce'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_reduce_or_stop')
    })

    test('sends a reduce or stop warning to a licence if it has a reduce or stop threshold and its a warning being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'warning'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'stop_or_reduce'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_reduce_or_stop_warning')
    })

    test('sends a reduce warning to a licence if it has a reduce threshold and its a warning being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'warning'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'reduce'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_reduce_warning')
    })

    test('sends a stop warning to a licence if it has a stop threshold and its a warning being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'warning'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'stop'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_stop_warning')
    })

    test('sends a resume notice to a licence if its a resume notice being issued', async () => {
      jobData.ev.metadata.options.sendingAlertType = 'resume'
      jobData.ev.metadata.options.linkages[0][0].alertType = 'stop_or_reduce'
      await getRecipients(jobData)
      const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args

      expect(row.messageRef).to.equal('water_abstraction_alert_resume')
    })

    test('formats the address coming from the CRM correctly', async () => {
      await getRecipients(jobData)
      const [notification] = scheduledNotificationsService.createScheduledNotification.lastCall.args
      const { personalisation } = notification

      expect(personalisation.address_line_1).to.equal('ADDRESS1')
      expect(personalisation.address_line_2).to.equal('ADDRESS2')
      expect(personalisation.address_line_3).to.equal('ADDRESS3')
      expect(personalisation.address_line_4).to.equal('ADDRESS4')
      expect(personalisation.address_line_5).to.equal('TOWN')
      expect(personalisation.address_line_6).to.equal('POSTCODE')
      expect(personalisation.address_line_7).to.equal('COUNTRY')
    })
  })

  experiment('for emails', () => {
    const emails = [{ email: 'some@email.com' }, { email: 'some-other@email.com' }]

    beforeEach(async () => {
      await crmV2Connector.companies.getCompanyWAAEmailContacts.resolves(emails)
      await getRecipients(jobData)
    })
    test('calls the getCompanyWAAContacts method', () => {
      expect(crmV2Connector.companies.getCompanyWAAEmailContacts.called).to.be.true()
    })
    test('calls scheduledNotificationService.createScheduledNotification as many times as there are email recipients', () => {
      expect(scheduledNotificationsService.createScheduledNotification.callCount).to.equal(emails.length)
    })
  })
})

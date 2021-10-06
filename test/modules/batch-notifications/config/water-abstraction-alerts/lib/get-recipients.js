const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const { logger } = require('../../../../../../src/logger');
const { getRecipients } =
  require('../../../../../../src/modules/batch-notifications/config/water-abstraction-alerts/lib/get-recipients');
const scheduledNotificationsService = require('../../../../../../src/lib/services/scheduled-notifications');
const eventHelpers =
  require('../../../../../../src/modules/batch-notifications/lib/event-helpers');

const crmV2Connector = require('../../../../../../src/lib/connectors/crm-v2');

const licenceGaugingStationConnector = require('../../../../../../src/lib/connectors/repos/licence-gauging-stations');

const lvpcConnector = require('../../../../../../src/lib/connectors/repos/licence-version-purpose-conditions');

const gaugingStationConnector = require('../../../../../../src/lib/connectors/repos/gauging-stations');

experiment('getRecipients', () => {
  const addressId = uuid();
  const companyId = uuid();
  const contactId = uuid();
  const licenceVersionPurposeConditionId = uuid();
  const licenceGaugingStationId = uuid();
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
  };

  beforeEach(async () => {
    sandbox.stub(crmV2Connector.documents, 'getDocumentByRefAndDate').resolves({
      addressId,
      companyId,
      contactId
    });
    sandbox.stub(crmV2Connector.addresses, 'getAddress').resolves({
      country: 'britain'
    });
    sandbox.stub(crmV2Connector.companies, 'getCompany').resolves();
    sandbox.stub(crmV2Connector.contacts, 'getContact').resolves();
    sandbox.stub(gaugingStationConnector, 'findOneByLinkageId').resolves({
      riverName: 'Avon',
      label: 'Gurney FS'
    });
    sandbox.stub(scheduledNotificationsService, 'createScheduledNotification').resolves({});
    sandbox.stub(licenceGaugingStationConnector, 'findOneById').resolves({
      licenceVersionPurposeConditionId
    });
    sandbox.stub(lvpcConnector, 'findOneById').resolves({
    });
    sandbox.stub(licenceGaugingStationConnector, 'updateStatus').resolves();
    sandbox.stub(eventHelpers, 'markAsProcessed');
    sandbox.stub(logger, 'error');
    await getRecipients(jobData);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('finds each relevant document', async () => {
    expect(crmV2Connector.documents.getDocumentByRefAndDate.callCount).to.equal(jobData.ev.metadata.options.linkages.length);
  });

  test('finds each relevant contact', async () => {
    expect(crmV2Connector.contacts.getContact.callCount).to.equal(jobData.ev.metadata.options.linkages.length);
  });

  test('finds each relevant company', async () => {
    expect(crmV2Connector.companies.getCompany.callCount).to.equal(jobData.ev.metadata.options.linkages.length);
  });

  test('finds each relevant address', async () => {
    expect(crmV2Connector.addresses.getAddress.callCount).to.equal(jobData.ev.metadata.options.linkages.length);
  });

  test('schedules a message for each de-duped contact', async () => {
    expect(scheduledNotificationsService.createScheduledNotification.callCount).to.equal(1);
    const [row] = scheduledNotificationsService.createScheduledNotification.lastCall.args;

    expect(Object.keys(row)).to.only.include([
      '_messageRef',
      '_eventId',
      '_licences',
      '_messageType',
      '_personalisation']
    );

    expect(row.messageRef).to.equal('water_abstraction_alert_stop');
  });
});

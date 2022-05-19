const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const notificationContacts = require('../../../../../../src/modules/batch-notifications/config/returns/lib/return-notification-contacts')
const documentsConnector = require('../../../../../../src/lib/connectors/crm/documents')
const returnsConnector = require('../../../../../../src/lib/connectors/returns')

const ContactList = require('../../../../../../src/lib/models/contact-list')

experiment('modules/batch-notifications/config/return-invitation/return-notification-contacts', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getRecipientList', () => {
    let result

    const returnCycle = {
      startDate: '2019-04-01',
      endDate: '2020-03-31',
      dueDate: '2020-04-28',
      isSummer: false
    }

    const returns = [{
      return_id: 'return_1',
      licence_ref: 'licence_1'
    }, {
      return_id: 'return_2',
      licence_ref: 'licence_2'
    }, {
      return_id: 'return_3',
      licence_ref: 'licence_2'
    }]

    const documentContacts = [{
      system_external_id: 'licence_1',
      contacts: [{
        role: 'primary_user',
        email: 'test@example.com'
      }]
    }, {
      system_external_id: 'licence_2',
      contacts: [{
        role: 'licence_holder',
        forename: 'John',
        name: 'Doe',
        salutation: 'Sir'
      }]
    }]

    beforeEach(async () => {
      sandbox.stub(documentsConnector, 'getLicenceContacts').resolves(documentContacts)
      sandbox.stub(returnsConnector, 'getCurrentDueReturns').resolves(returns)

      result = await notificationContacts.getReturnContacts(['01/123', '02/456'], returnCycle)
    })

    experiment('calls returnsConnector.getCurrentDueReturns', () => {
      test('once', async () => {
        expect(returnsConnector.getCurrentDueReturns.callCount).to.equal(1)
      })

      test('the first argument is an array of licence numbers to exclude', async () => {
        const [licenceNumbers] = returnsConnector.getCurrentDueReturns.lastCall.args
        expect(licenceNumbers).to.equal(['01/123', '02/456'])
      })

      test('the second argument is the return cycle', async () => {
        const [, cycle] = returnsConnector.getCurrentDueReturns.lastCall.args
        expect(cycle).to.equal(returnCycle)
      })
    })

    test('resolves with an array of objects for each licence, with contact and return lists', async () => {
      expect(result.length).to.equal(2)
      expect(result[0].licenceNumber).to.equal('licence_1')
      expect(result[0].returns).to.equal([returns[0]])
      expect(result[0].contacts).to.be.instanceof(ContactList)

      expect(result[1].licenceNumber).to.equal('licence_2')
      expect(result[1].returns).to.equal([returns[1], returns[2]])
      expect(result[1].contacts).to.be.instanceof(ContactList)
    })

    test('first licence contains correct contacts', async () => {
      const contacts = result[0].contacts.toArray()
      expect(contacts.length).to.equal(1)
      expect(contacts[0].email).to.equal('test@example.com')
    })

    test('second licence contains correct contacts', async () => {
      const contacts = result[1].contacts.toArray()
      expect(contacts.length).to.equal(1)
      expect(contacts[0].salutation).to.equal('Sir')
    })
  })
})

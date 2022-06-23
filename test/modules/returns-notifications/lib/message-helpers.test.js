const Lab = require('@hapi/lab')
const lab = Lab.script()
const { expect } = require('@hapi/code')

const { getJobData, formatAddressKeys, formatEnqueueOptions } = require('../../../../src/modules/returns-notifications/lib/message-helpers.js')

lab.experiment('Test getJobData', () => {
  const ret = {
    return_id: 'v1:123:456',
    licence_ref: '01/123'
  }

  const event = {
    eventId: '12345'
  }

  const messageRef = 'REF'

  const config = {
    rolePriority: ['returns_to', 'licence_holder']
  }

  lab.test('getJobData should format object', async () => {
    const obj = getJobData(ret, event, messageRef, config)

    expect(obj).to.equal({
      eventId: event.eventId,
      returnId: ret.return_id,
      messageRef,
      licenceNumber: ret.licence_ref,
      config
    })
  })
})

lab.experiment('Test formatAddressKeys', () => {
  const contact = {
    town: 'Bristol',
    address_1: 'Daisy House',
    address_12: 'Windy Lane',
    address_email: 'mail@example.com'
  }

  lab.test('formatAddressKeys should replace address_<i> keys with address_line_<i> and leave other keys unchanged', async () => {
    const obj = formatAddressKeys(contact)

    expect(obj).to.equal({
      town: 'Bristol',
      address_line_1: 'Daisy House',
      address_line_12: 'Windy Lane',
      address_email: 'mail@example.com'
    })
  })
})

lab.experiment('formatEnqueueOptions', () => {
  let result

  lab.beforeEach(async () => {
    const data = { eventId: 1, messageRef: 'ref' }
    const ret = {
      due_date: '2018-01-01',
      return_id: 'r_id',
      licence_ref: 'l_ref',
      metadata: {
        description: 'desc',
        isTwoPartTariff: true,
        nald: {
          regionCode: 1,
          areaCode: 'ARCA',
          formatId: 123321
        }
      }
    }
    const contactData = { contact: { entity_id: 'e_id' } }
    result = formatEnqueueOptions(data, ret, contactData)
  })

  lab.test('adds regionCode to the personalisation', async () => {
    expect(result.personalisation.regionCode).to.equal(1)
  })

  lab.test('adds areaCode to the personalisation', async () => {
    expect(result.personalisation.areaCode).to.equal('ARCA')
  })

  lab.test('adds siteDescription to the personalisation', async () => {
    expect(result.personalisation.siteDescription).to.equal('desc')
  })

  lab.test('adds isTwoPartTariff to the personalisation', async () => {
    expect(result.personalisation.isTwoPartTariff).to.equal(true)
  })

  lab.test('adds formatId to the personalisation', async () => {
    expect(result.personalisation.formatId).to.equal(123321)
  })

  lab.test('adds dueDate to the personalisation', async () => {
    expect(result.personalisation.dueDate).to.equal('2018-01-01')
  })
})

exports.lab = lab

const licenceData = require('../../../responses/permits/licence/licence-data.json')

const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const { createContact } = require('../../../../src/lib/models/factory/contact')

experiment('Contact factory', () => {
  test('should create a Contact from NALD party and address', async () => {
    const contact = createContact('Licence holder',
      licenceData.data.roles[0].role_party,
      licenceData.data.roles[0].role_address
    )

    // Role and type
    expect(contact.type).to.equal('Person')
    expect(contact.role).to.equal('Licence holder')

    // Name
    expect(contact.firstName).to.equal('John')
    expect(contact.initials).to.equal('H')
    expect(contact.name).to.equal('Doe')
    expect(contact.salutation).to.equal('Mr')

    // Address
    expect(contact.addressLine1).to.equal('Daisy cow farm')
    expect(contact.addressLine2).to.equal('Long road')
    expect(contact.addressLine3).to.equal(null)
    expect(contact.addressLine4).to.equal(null)
    expect(contact.town).to.equal('Daisybury')
    expect(contact.county).to.equal('Testingshire')
    expect(contact.postcode).to.equal('TT1 1TT')
    expect(contact.country).to.equal(null)
  })
})

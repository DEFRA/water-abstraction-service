const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { mapContactAddress } =
 require('../../../../src/modules/batch-notifications/lib/notify-helpers')
const Contact = require('../../../../src/lib/models/contact')

experiment('mapContactAddress', () => {
  test('should map an individual address to Notify personalisation fields', async () => {
    const contact = new Contact({
      type: Contact.CONTACT_TYPE_PERSON,
      salutation: 'Viscount',
      initials: 'J',
      firstName: 'John',
      name: 'Doe',
      addressLine1: 'Daisy Farm',
      addressLine2: 'Daisy Cottage',
      addressLine3: 'Test lane',
      addressLine4: 'Test village',
      town: 'Testington',
      county: 'Testshire',
      country: 'England',
      postcode: 'TT1 1TT'
    })
    const personalisation = mapContactAddress(contact)
    expect(personalisation).to.equal({
      address_line_1: 'Viscount J Doe',
      address_line_2: 'Daisy Farm, Daisy Cottage',
      address_line_3: 'Test lane, Test village',
      address_line_4: 'Testington',
      address_line_5: 'Testshire',
      address_line_6: 'England',
      postcode: 'TT1 1TT'
    })
  })

  test('should map a company address to Notify personalisation fields', async () => {
    const contact = new Contact({
      type: Contact.CONTACT_TYPE_ORGANISATION,
      salutation: 'Viscount',
      initials: 'J',
      firstName: 'John',
      name: 'Umami Cheese Co',
      addressLine1: 'Daisy Farm',
      addressLine2: 'Daisy Cottage',
      addressLine3: 'Test lane',
      addressLine4: 'Test village',
      town: 'Testington',
      county: 'Testshire',
      country: 'England',
      postcode: 'TT1 1TT'
    })
    const personalisation = mapContactAddress(contact)
    expect(personalisation).to.equal({
      address_line_1: 'Umami Cheese Co',
      address_line_2: 'Daisy Farm, Daisy Cottage',
      address_line_3: 'Test lane, Test village',
      address_line_4: 'Testington',
      address_line_5: 'Testshire',
      address_line_6: 'England',
      postcode: 'TT1 1TT'
    })
  })
})

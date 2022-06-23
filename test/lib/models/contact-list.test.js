const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const ContactList = require('../../../src/lib/models/contact-list')
const Contact = require('../../../src/lib/models/contact')

const contactA = new Contact({
  role: 'Returns to'
})

const contactB = new Contact({
  role: 'Licence holder'
})

experiment('ContactList model', () => {
  test('pass contacts in constructor', async () => {
    const contacts = new ContactList([contactA, contactB])
    expect(contacts.toArray()).to.equal([contactA, contactB])
  })

  test('add contacts to list', async () => {
    const contacts = new ContactList()
    contacts.add(contactA)
    expect(contacts.toArray()).to.equal([contactA])
  })

  test('find first contact by role', async () => {
    const contacts = new ContactList()
    contacts.add(contactA)
    contacts.add(contactB)
    expect(contacts.getByRole('Licence holder')).to.equal(contactB)
  })

  test('filter contacts by role', async () => {
    const contacts = new ContactList()
    contacts.add(contactA)
    contacts.add(contactB)
    contacts.add(contactB)
    const result = contacts.getAllByRole('Licence holder')
    expect(result).to.be.an.array().length(2)
    expect(result).to.equal([contactB, contactB])
  })
})

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const Contact = require('../../../src/lib/models/contact');

const data = {
  type: 'person',
  role: 'Licence holder',
  salutation: 'Mr',
  initials: 'J',
  firstName: 'John',
  name: 'Doe'

};

experiment('Contact model', () => {
  test('stores properties passed in the constructor', async () => {
    const contact = new Contact(data);
    expect(contact.type).to.equal(data.type);
    expect(contact.role).to.equal(data.role);

    // Name
    expect(contact.salutation).to.equal(data.salutation);
    expect(contact.initials).to.equal(data.initials);
    expect(contact.firstName).to.equal(data.firstName);
    expect(contact.name).to.equal(data.name);

    // Address
    expect(contact.addressLine1).to.equal(data.addressLine1);
    expect(contact.addressLine2).to.equal(data.addressLine2);
    expect(contact.addressLine3).to.equal(data.addressLine3);
    expect(contact.addressLine4).to.equal(data.addressLine4);
    expect(contact.town).to.equal(data.town);
    expect(contact.county).to.equal(data.county);
    expect(contact.postcode).to.equal(data.postcode);
    expect(contact.country).to.equal(data.country);
  });

  test('it should get a full name for a person', async () => {
    const contact = new Contact(data);
    expect(contact.getFullName()).to.equal('Mr J Doe');
  });

  test('it should get a full name for a person when initials are null', async () => {
    const updated = { ...data, initials: null };
    const contact = new Contact(updated);
    expect(contact.getFullName()).to.equal('Mr John Doe');
  });

  test('it should get a full name for a person when firstName is null', async () => {
    const updated = { ...data, firstName: null };
    const contact = new Contact(updated);
    expect(contact.getFullName()).to.equal('Mr J Doe');
  });

  test('it should get a full name for a person when initials and firstName are null', async () => {
    const updated = { ...data, initials: null, firstName: null };
    const contact = new Contact(updated);
    expect(contact.getFullName()).to.equal('Mr Doe');
  });

  test('it should get a full name for an organisation', async () => {
    const updated = { ...data, type: 'Organisation' };
    const contact = new Contact(updated);
    expect(contact.getFullName()).to.equal('Doe');
  });
});

const { expect } = require('@hapi/code');
const { experiment, test, fail, beforeEach } = exports.lab = require('@hapi/lab').script();

const Contact = require('../../../src/lib/models/contact-v2');

const data = {
  id: '7931b58b-6410-44c0-b0a5-12a1ec14de64',
  initials: 'A B C',
  salutation: 'Captain',
  firstName: 'John',
  lastName: 'Doe'
};

experiment('lib/models/contact-v2 model', () => {
  let contact;

  beforeEach(async () => {
    contact = new Contact();
  });

  test('can set/get a GUID ID', async () => {
    contact.id = data.id;
    expect(contact.id).to.equal(data.id);
  });

  test('throws an error if attempting to set non-guid ID', async () => {
    try {
      contact.id = 'not-a-guid';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get initials to a string', async () => {
    contact.initials = data.initials;
    expect(contact.initials).to.equal(data.initials);
  });

  test('can set/get initials to null', async () => {
    contact.initials = null;
    expect(contact.initials).to.equal(null);
  });

  test('setting initials to a type other than string/null throws an error', async () => {
    try {
      contact.initials = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get salutation to a string', async () => {
    contact.salutation = data.salutation;
    expect(contact.salutation).to.equal(data.salutation);
  });

  test('can set/get salutation to null', async () => {
    contact.salutation = null;
    expect(contact.salutation).to.equal(null);
  });

  test('setting salutation to a type other than string/null throws an error', async () => {
    try {
      contact.salutation = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get firstName to a string', async () => {
    contact.firstName = data.firstName;
    expect(contact.firstName).to.equal(data.firstName);
  });

  test('can set/get firstName to null', async () => {
    contact.firstName = null;
    expect(contact.firstName).to.equal(null);
  });

  test('setting firstName to a type other than string/null throws an error', async () => {
    try {
      contact.firstName = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get lastName to a string', async () => {
    contact.lastName = data.lastName;
    expect(contact.lastName).to.equal(data.lastName);
  });

  test('can set/get lastName to null', async () => {
    contact.lastName = null;
    expect(contact.lastName).to.equal(null);
  });

  test('setting lastName to a type other than string/null throws an error', async () => {
    try {
      contact.lastName = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  experiment('construction', () => {
    test('can include an id', async () => {
      const contact = new Contact(data.id);
      expect(contact.id).to.equal(data.id);
    });

    test('can omit the id', async () => {
      const contact = new Contact();
      expect(contact.id).to.be.undefined();
    });
  });

  experiment('when contact is populated', () => {
    beforeEach(async () => {
      contact.id = data.id;
      contact.initials = data.initials;
      contact.salutation = data.salutation;
      contact.firstName = data.firstName;
      contact.lastName = data.lastName;
    });

    test('full name returns the full name', async () => {
      expect(contact.fullName).to.equal('Captain A B C Doe');
    });

    test('full name returns the full name when initials are null', async () => {
      contact.initials = null;
      expect(contact.fullName).to.equal('Captain John Doe');
    });

    test('.toJSON returns all data', async () => {
      const json = contact.toJSON();
      expect(json).to.equal({
        id: data.id,
        salutation: data.salutation,
        initials: data.initials,
        firstName: data.firstName,
        lastName: data.lastName
      });
    });
  });
});

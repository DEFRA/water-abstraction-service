const { expect } = require('@hapi/code');
const { experiment, test, fail, beforeEach } = exports.lab = require('@hapi/lab').script();

const Contact = require('../../../src/lib/models/contact-v2');

const data = {
  id: '7931b58b-6410-44c0-b0a5-12a1ec14de64',
  title: 'Captain',
  firstName: 'John',
  initials: 'A B C',
  middleInitials: 'B C',
  lastName: 'Doe',
  suffix: 'PhD',
  department: 'Naval Reserves'
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

  test('can set/get middleInitials to a string', async () => {
    contact.middleInitials = data.middleInitials;
    expect(contact.middleInitials).to.equal(data.middleInitials);
  });

  test('can set/get middleInitials to null', async () => {
    contact.middleInitials = null;
    expect(contact.middleInitials).to.equal(null);
  });

  test('setting middleInitials to a type other than string/null throws an error', async () => {
    try {
      contact.middleInitials = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get title to a string', async () => {
    contact.title = data.title;
    expect(contact.title).to.equal(data.title);
  });

  test('can set/get title to null', async () => {
    contact.title = null;
    expect(contact.title).to.equal(null);
  });

  test('setting title to a type other than string/null throws an error', async () => {
    try {
      contact.title = 123;
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

  test('can set/get suffix to a string', async () => {
    contact.suffix = data.suffix;
    expect(contact.suffix).to.equal(data.suffix);
  });

  test('can set/get suffix to null', async () => {
    contact.suffix = null;
    expect(contact.suffix).to.equal(null);
  });

  test('setting suffix to a type other than string/null throws an error', async () => {
    try {
      contact.suffix = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get department to a string', async () => {
    contact.department = data.department;
    expect(contact.department).to.equal(data.department);
  });

  test('can set/get department to null', async () => {
    contact.department = null;
    expect(contact.department).to.equal(null);
  });

  test('setting department to a type other than string/null throws an error', async () => {
    try {
      contact.department = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get type to a "person"', async () => {
    contact.type = 'person';
    expect(contact.type).to.equal('person');
  });

  test('can set/get type to a "department"', async () => {
    contact.type = 'department';
    expect(contact.type).to.equal('department');
  });

  test('can set/get type to null', async () => {
    contact.type = null;
    expect(contact.type).to.equal(null);
  });

  test('setting type to anything else', async () => {
    try {
      contact.type = 'individual';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get dataSource to a "wrls"', async () => {
    contact.dataSource = 'wrls';
    expect(contact.dataSource).to.equal('wrls');
  });

  test('can set/get dataSource to a "nald"', async () => {
    contact.dataSource = 'nald';
    expect(contact.dataSource).to.equal('nald');
  });

  test('cannot set/get dataSource to null', async () => {
    try {
      contact.dataSource = null;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('setting dataSource to anything else', async () => {
    try {
      contact.dataSource = 'somewhere else';
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
      contact.title = data.title;
      contact.firstName = data.firstName;
      contact.lastName = data.lastName;
      contact.dataSource = 'nald';
    });

    experiment('when data source is nald', () => {
      test('full name returns the full name', async () => {
        expect(contact.fullName).to.equal('Captain A B C Doe');
      });

      test('full name returns the full name when initials are null', async () => {
        contact.initials = null;
        expect(contact.fullName).to.equal('Captain John Doe');
      });

      test('full name returns the suffix when it is not null', async () => {
        contact.suffix = data.suffix;
        expect(contact.fullName).to.equal('Captain A B C Doe, PhD');
      });
    });

    experiment('when data source is wrls', () => {
      beforeEach(() => {
        contact.middleInitials = data.middleInitials;
        contact.dataSource = 'wrls';
      });
      test('full name returns the full name', async () => {
        expect(contact.fullName).to.equal('Captain J B C Doe');
      });

      test('full name returns the full name when initials are null', async () => {
        contact.middleInitials = null;
        expect(contact.fullName).to.equal('Captain John Doe');
      });

      test('full name returns the suffix when it is not null', async () => {
        contact.suffix = data.suffix;
        expect(contact.fullName).to.equal('Captain J B C Doe, PhD');
      });
    });

    test('.toJSON returns all data', async () => {
      const json = contact.toJSON();
      expect(json).to.equal({
        id: data.id,
        title: data.title,
        initials: data.initials,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: 'Captain A B C Doe',
        dataSource: 'nald'
      });
    });
  });
});

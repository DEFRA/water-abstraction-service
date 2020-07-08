'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');
const moment = require('moment');

const CompanyContact = require('../../../src/lib/models/company-contact');
const Role = require('../../../src/lib/models/role-v2');
const Contact = require('../../../src/lib/models/contact-v2');

experiment('lib/models/company-contact', () => {
  let companyContact;

  beforeEach(async () => {
    companyContact = new CompanyContact();
  });

  experiment('.id', () => {
    test('can be set to a valid UUID', async () => {
      const id = uuid();
      companyContact.id = id;
      expect(companyContact.id).to.equal(id);
    });

    test('throws an error if attempting to set non-guid ID', async () => {
      expect(() => {
        companyContact.id = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.companyId', () => {
    test('can be set to a valid UUID', async () => {
      const companyId = uuid();
      companyContact.companyId = companyId;
      expect(companyContact.companyId).to.equal(companyId);
    });

    test('throws an error if attempting to set non-guid ID', async () => {
      expect(() => {
        companyContact.companyId = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.contactId', () => {
    test('can be set to a valid UUID', async () => {
      const contactId = uuid();
      companyContact.contactId = contactId;
      expect(companyContact.contactId).to.equal(contactId);
    });

    test('throws an error if attempting to set non-guid ID', async () => {
      expect(() => {
        companyContact.contactId = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.roleId', () => {
    test('can be set to a valid UUID', async () => {
      const roleId = uuid();
      companyContact.roleId = roleId;
      expect(companyContact.roleId).to.equal(roleId);
    });

    test('throws an error if attempting to set non-guid ID', async () => {
      expect(() => {
        companyContact.roleId = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.isDefault', () => {
    test('can be set to a boolean', async () => {
      companyContact.isDefault = true;
      expect(companyContact.isDefault).to.equal(true);
    });

    test('throws an error if attempting to set to non boolean', async () => {
      expect(() => {
        companyContact.isDefault = 'potatoes';
      }).to.throw();
    });
  });

  experiment('.startDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      companyContact.startDate = dateString;

      expect(companyContact.startDate).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      companyContact.startDate = date;

      expect(companyContact.startDate).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      companyContact.startDate = now;

      expect(companyContact.startDate).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';
      expect(() => { companyContact.startDate = dateString; }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => { companyContact.startDate = true; }).to.throw();
    });

    test('throws for null', async () => {
      expect(() => { companyContact.startDate = null; }).to.throw();
    });
  });

  experiment('.endDate', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      companyContact.endDate = dateString;

      expect(companyContact.endDate).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      companyContact.endDate = date;

      expect(companyContact.endDate).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      companyContact.endDate = now;

      expect(companyContact.endDate).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';
      expect(() => { companyContact.endDate = dateString; }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => { companyContact.endDate = true; }).to.throw();
    });

    test('allows null', async () => {
      companyContact.endDate = null;
      expect(companyContact.endDate).to.be.null();
    });
  });

  experiment('.dateCreated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      companyContact.dateCreated = dateString;

      expect(companyContact.dateCreated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      companyContact.dateCreated = date;

      expect(companyContact.dateCreated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      companyContact.dateCreated = now;

      expect(companyContact.dateCreated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        companyContact.dateCreated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        companyContact.dateCreated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      companyContact.dateCreated = null;
      expect(companyContact.dateCreated).to.be.null();
    });
  });

  experiment('.dateUpdated', () => {
    test('converts an ISO date string to a moment internally', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      companyContact.dateUpdated = dateString;

      expect(companyContact.dateUpdated).to.equal(moment(dateString));
    });

    test('converts a JS Date to a moment internally', async () => {
      const date = new Date();
      companyContact.dateUpdated = date;

      expect(companyContact.dateUpdated).to.equal(moment(date));
    });

    test('can be set using a moment', async () => {
      const now = moment();
      companyContact.dateUpdated = now;

      expect(companyContact.dateUpdated).to.equal(now);
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';

      expect(() => {
        companyContact.dateUpdated = dateString;
      }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => {
        companyContact.dateUpdated = true;
      }).to.throw();
    });

    test('allows null', async () => {
      companyContact.dateUpdated = null;
      expect(companyContact.dateUpdated).to.be.null();
    });
  });

  experiment('.contact', () => {
    test('can be set to a Contact instance', async () => {
      const contact = new Contact(uuid());
      companyContact.contact = contact;
      expect(companyContact.contact.id).to.equal(contact.id);
    });

    test('can be set to null', async () => {
      companyContact.contact = null;
      expect(companyContact.contact).to.equal(null);
    });

    test('throws for an invalid value', async () => {
      expect(() => {
        companyContact.contact = false;
      }).to.throw();
    });
  });

  experiment('.role', () => {
    test('can be set to a Role instance', async () => {
      const role = new Role(uuid());
      companyContact.role = role;
      expect(companyContact.role.id).to.equal(role.id);
    });

    test('can be set to null', async () => {
      companyContact.role = null;
      expect(companyContact.role).to.equal(null);
    });

    test('throws for an invalid value', async () => {
      expect(() => {
        companyContact.role = false;
      }).to.throw();
    });
  });
});

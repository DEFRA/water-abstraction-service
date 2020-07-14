'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const CompanyContact = require('../../../src/lib/models/company-contact');
const Contact = require('../../../src/lib/models/contact-v2');
const DateRange = require('../../../src/lib/models/date-range');

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/company-contact', () => {
  let companyContact;

  beforeEach(async () => {
    companyContact = new CompanyContact();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      companyContact.id = TEST_GUID;
      expect(companyContact.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        companyContact.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.contact', () => {
    test('can be set to a valid Contact', async () => {
      const contact = new Contact();
      companyContact.contact = contact;
      expect(companyContact.contact).to.equal(contact);
    });

    test('throws an error if set to another model', async () => {
      const func = () => {
        companyContact.contact = new DateRange();
      };
      expect(func).to.throw();
    });
  });

  experiment('.emailAddress', () => {
    test('can be set to an email address', async () => {
      companyContact.emailAddress = 'test@example.com';
      expect(companyContact.emailAddress).to.equal('test@example.com');
    });

    test('can be set to null', async () => {
      companyContact.emailAddress = null;
      expect(companyContact.emailAddress).to.equal(null);
    });

    test('throws an error if set to unexpected value', async () => {
      const func = () => {
        companyContact.emailAddress = 'not an email address';
      };
      expect(func).to.throw();
    });
  });

  experiment('.roleName', () => {
    CompanyContact.ROLE_NAMES.forEach(role => {
      test(`can be set to a ${role}`, async () => {
        companyContact.roleName = role;
        expect(companyContact.roleName).to.equal(role);
      });
    });

    test('throws an error if set to unexpected value', async () => {
      const func = () => {
        companyContact.roleName = 'invalid-role';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        companyContact.roleName = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.isDefault', () => {
    test('can be set to a boolean', async () => {
      companyContact.isDefault = true;
      expect(companyContact.isDefault).to.equal(true);
    });

    test('throws an error if set to anything other than a boolean', async () => {
      const func = () => {
        companyContact.isDefault = 'yeap';
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        companyContact.isDefault = null;
      };
      expect(func).to.throw();
    });
  });

  experiment('.dateRange', () => {
    let dateRange;

    beforeEach(async () => {
      dateRange = new DateRange('2019-04-01', '2020-03-31');
    });

    test('can be set to a DateRange object', async () => {
      companyContact.dateRange = dateRange;
      expect(companyContact.dateRange).to.equal(dateRange);
    });

    test('throws an error if set to any other type', async () => {
      const func = () => {
        companyContact.dateRange = new Contact();
      };

      expect(func).to.throw();
    });
  });
});

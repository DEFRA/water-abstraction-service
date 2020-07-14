'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const CompanyContact = require('../../../src/lib/models/company-contact');
const DateRange = require('../../../src/lib/models/date-range');
const Contact = require('../../../src/lib/models/contact-v2');

const companyContactMapper = require('../../../src/lib/mappers/company-contact');

const dbRow = {
  companyContactId: '00000000-0000-0000-0000-000000000000',
  startDate: '2018-01-01',
  endDate: '2020-04-01',
  isDefault: true
};

experiment('modules/billing/mappers/company-contact', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = companyContactMapper.crmToModel(dbRow);
    });

    test('returns an CompanyContact instance', async () => {
      expect(result instanceof CompanyContact).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.companyContactId);
    });

    test('has the expected date range values', async () => {
      const { dateRange } = result;
      expect(dateRange instanceof DateRange).to.be.true();
      expect(dateRange.startDate).to.equal(dbRow.startDate);
      expect(dateRange.endDate).to.equal(dbRow.endDate);
    });

    experiment('roleName', () => {
      test('is not mapped if it is not present', async () => {
        expect(result.roleName).to.be.undefined();
      });

      test('has the expected role name value if present', async () => {
        const result = companyContactMapper.crmToModel({ ...dbRow, role: { name: 'billing' } });
        expect(result.roleName).to.equal('billing');
      });
    });

    experiment('contact', () => {
      const contactData = {
        contactId: '00000000-0000-0000-0000-000000000000',
        salutation: null,
        firstName: 'First name',
        initials: null,
        middleInitials: 'A',
        lastName: 'Last name',
        suffix: null,
        department: null,
        type: 'person',
        dataSource: 'wrls'
      };

      test('is not mapped if it is not present', async () => {
        expect(result.contact).to.be.undefined();
      });

      test('has the expected contact value if present', async () => {
        const { contact } = companyContactMapper.crmToModel({ ...dbRow, contact: contactData });
        expect(contact instanceof Contact).to.be.true();
        expect(contact.id).to.equal(contactData.contactId);
      });
    });
  });
});

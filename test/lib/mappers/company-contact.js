'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const moment = require('moment');
const { expect } = require('@hapi/code');
const mapper = require('../../../src/lib/mappers/company-contact');

experiment('modules/billing/mappers/company-contact', () => {
  experiment('.crmToModel', () => {
    let mapped;
    let row;

    beforeEach(async () => {
      row = {
        companyContactId: '62f285a6-928e-4872-8d00-6eac5325522e',
        companyId: 'ffffe5d7-b2d4-4f88-b2f5-d0b497bc276f',
        contactId: 'f9d3b35c-b55b-4af8-98a2-beb3c1323ee9',
        roleId: '5774f9ac-94ef-4fa1-9d9c-8cda614d6f17',
        isDefault: true,
        emailAddress: null,
        startDate: '2006-03-10',
        endDate: null,
        dateCreated: '2020-05-06T14:20:56.425Z',
        dateUpdated: '2020-05-31T06:34:33.764Z',
        isTest: false,
        contact: {
          contactId: 'f9d3b35c-b55b-4af8-98a2-beb3c1323ee9',
          salutation: 'test-salutation',
          firstName: 'test-first-name',
          middleNames: 'test-middle-names',
          lastName: 'test-last-name',
          externalId: '1:123',
          dateCreated: '2020-05-06T14:20:56.424Z',
          dateUpdated: '2020-05-31T06:34:33.762Z',
          initials: null,
          isTest: false
        },
        role: {
          roleId: '5774f9ac-94ef-4fa1-9d9c-8cda614d6f17',
          name: 'billing',
          dateCreated: '2020-05-04T15:06:49.058Z',
          dateUpdated: '2020-05-04T15:06:49.058Z'
        }
      };

      mapped = mapper.crmToModel(row);
    });

    test('has the mapped id', async () => {
      expect(mapped.id).to.equal(row.companyContactId);
    });

    test('has the mapped contactId', async () => {
      expect(mapped.contactId).to.equal(row.contactId);
    });

    test('has the mapped roleId', async () => {
      expect(mapped.roleId).to.equal(row.roleId);
    });

    test('has the mapped isDefault value', async () => {
      expect(mapped.isDefault).to.equal(row.isDefault);
    });

    test('has the mapped startDate', async () => {
      expect(mapped.startDate).to.equal(moment(row.startDate));
    });

    test('has the mapped endDate', async () => {
      expect(mapped.endDate).to.equal(row.endDate);
    });

    test('has the mapped dateCreated value', async () => {
      expect(mapped.dateCreated).to.equal(moment(row.dateCreated));
    });

    test('has the mapped dateUpdated value', async () => {
      expect(mapped.dateUpdated).to.equal(moment(row.dateUpdated));
    });

    test('has the mapped contact', async () => {
      expect(mapped.contact.id).to.equal(row.contact.contactId);
    });

    test('has the mapped role', async () => {
      expect(mapped.role.id).to.equal(row.role.roleId);
    });

    test('handles the absence of the role', async () => {
      delete row.role;
      mapped = mapper.crmToModel(row);
      expect(mapped.role).to.equal(undefined);
    });

    test('handles the absence of the contact', async () => {
      delete row.contact;
      mapped = mapper.crmToModel(row);
      expect(mapped.contact).to.equal(undefined);
    });
  });
});

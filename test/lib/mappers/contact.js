'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const mapper = require('../../../src/lib/mappers/contact');

experiment('modules/billing/mappers/contact', () => {
  experiment('.crmToModel', () => {
    let mapped;
    let row;

    beforeEach(async () => {
      row = {
        contactId: 'f9d3b35c-b55b-4af8-98a2-beb3c1323ee9',
        salutation: 'test-salutation',
        firstName: 'test-first-name',
        middleNames: 'test-middle',
        lastName: 'test-last-name',
        externalId: '1:123',
        dateCreated: '2020-05-06T14:20:56.424Z',
        dateUpdated: '2020-05-31T06:34:33.762Z',
        initials: 'test-initials',
        isTest: false
      };

      mapped = mapper.crmToModel(row);
    });

    test('has the mapped id', async () => {
      expect(mapped.id).to.equal(row.contactId);
    });

    test('has the mapped salutation', async () => {
      expect(mapped.salutation).to.equal(row.salutation);
    });

    test('has the mapped initials', async () => {
      expect(mapped.initials).to.equal(row.initials);
    });

    test('has the mapped firstName', async () => {
      expect(mapped.firstName).to.equal(row.firstName);
    });

    test('has the mapped lastName', async () => {
      expect(mapped.lastName).to.equal(row.lastName);
    });
  });
});

'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Contact = require('../../../src/lib/models/contact-v2');
const contactMapper = require('../../../src/lib/mappers/contact');

const dbRow = {
  contactId: '00000000-0000-0000-0000-000000000000',
  salutation: 'Admiral',
  firstName: 'John',
  initials: 'J A',
  middleInitials: 'A',
  lastName: 'Testington',
  suffix: 'OBE',
  deparment: 'Department',
  type: 'person',
  dataSource: 'wrls'
};

const contactData = {
  title: 'Admiral',
  firstName: 'John',
  middleInitials: 'A',
  lastName: 'Testington',
  dataSource: 'wrls'
};

experiment('modules/billing/mappers/contact', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = contactMapper.crmToModel(dbRow);
    });

    test('returns null when data is empty', async () => {
      const result = contactMapper.crmToModel(null);
      expect(result).to.equal(null);
    });

    test('returns an Contact instance', async () => {
      expect(result instanceof Contact).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.contactId);
    });

    test('has the expected title value', async () => {
      expect(result.title).to.equal(dbRow.salutation);
    });

    test('has the expected first name value', async () => {
      expect(result.firstName).to.equal(dbRow.firstName);
    });

    test('has the expected initials value', async () => {
      expect(result.initials).to.equal(dbRow.initials);
    });

    test('has the expected middleInitials value', async () => {
      expect(result.middleInitials).to.equal(dbRow.middleInitials);
    });

    test('has the expected last name value', async () => {
      expect(result.lastName).to.equal(dbRow.lastName);
    });

    test('has the expected suffix value', async () => {
      expect(result.suffix).to.equal(dbRow.suffix);
    });

    test('has the expected department value', async () => {
      expect(result.department).to.equal(dbRow.department);
    });

    test('has the expected type value', async () => {
      expect(result.type).to.equal(dbRow.type);
    });
  });

  experiment('.serviceToCrm', () => {
    let result;

    beforeEach(async () => {
      result = contactMapper.serviceToCrm(contactData);
    });

    test('maps title to salutation', async () => {
      expect(result.salutation).to.equal(contactData.title);
    });

    test('remaining data does not include title', async () => {
      expect(result.title).to.be.undefined();
    });

    test('returns remaining data as is', async () => {
      expect(result.firstName).to.equal(contactData.firstName);
      expect(result.middleInitials).to.equal(contactData.middleInitials);
      expect(result.lastName).to.equal(contactData.lastName);
      expect(result.dataSource).to.equal(contactData.dataSource);
    });
  });
});

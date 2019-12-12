const { expect } = require('@hapi/code');
const { experiment, test, fail, beforeEach } = exports.lab = require('@hapi/lab').script();

const Company = require('../../../src/lib/models/company');

const TEST_GUID = '7931b58b-6410-44c0-b0a5-12a1ec14de64';
const TEST_NAME = 'Big co ltd';

experiment('lib/models/company model', () => {
  let company;

  beforeEach(async () => {
    company = new Company();
  });

  test('can set/get a GUID ID', async () => {
    company.id = TEST_GUID;
    expect(company.id).to.equal(TEST_GUID);
  });

  test('throws an error if attempting to set non-guid ID', async () => {
    try {
      company.id = 'not-a-guid';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get type to "person"', async () => {
    company.type = Company.TYPE_PERSON;
    expect(company.type).to.equal(Company.TYPE_PERSON);
  });

  test('can set/get type to "organisation"', async () => {
    company.type = Company.TYPE_ORGANISATION;
    expect(company.type).to.equal(Company.TYPE_ORGANISATION);
  });

  test('throws an error if attempting to set invalid type', async () => {
    try {
      company.type = 'invalid-type';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get name to a string', async () => {
    company.name = TEST_NAME;
    expect(company.name).to.equal(TEST_NAME);
  });

  test('throws an error if attempting to set empty name', async () => {
    try {
      company.name = '';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('throws an error if attempting to set name to non-string', async () => {
    try {
      company.name = 123;
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  experiment('when company is populated', () => {
    beforeEach(async () => {
      company.id = TEST_GUID;
      company.name = TEST_NAME;
      company.type = Company.TYPE_PERSON;
    });

    test('.toJSON returns all data', async () => {
      const data = company.toJSON();
      expect(data).to.equal({
        id: TEST_GUID,
        name: TEST_NAME,
        type: Company.TYPE_PERSON
      });
    });
  });
});

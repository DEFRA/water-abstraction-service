const { expect } = require('@hapi/code');
const { experiment, test, fail, beforeEach } = exports.lab = require('@hapi/lab').script();

const Company = require('../../../src/lib/models/company');
const CompanyAddress = require('../../../src/lib/models/company-address');
const CompanyContact = require('../../../src/lib/models/company-contact');

const TEST_GUID = '7931b58b-6410-44c0-b0a5-12a1ec14de64';
const TEST_NAME = 'Big co ltd';

experiment('lib/models/company model', () => {
  let company;

  beforeEach(async () => {
    company = new Company();
  });

  experiment('construction', () => {
    test('can include an id', async () => {
      const company = new Company(TEST_GUID);
      expect(company.id).to.equal(TEST_GUID);
    });

    test('can omit the id', async () => {
      const company = new Company();
      expect(company.id).to.be.undefined();
    });

    test('sets company addresses to an empty array ', async () => {
      const company = new Company();
      expect(company.companyAddresses).to.equal([]);
    });

    test('sets company contacts to an empty array ', async () => {
      const company = new Company();
      expect(company.companyContacts).to.equal([]);
    });
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
    company.type = Company.COMPANY_TYPES.person;
    expect(company.type).to.equal(Company.COMPANY_TYPES.person);
  });

  test('can set/get type to "organisation"', async () => {
    company.type = Company.COMPANY_TYPES.organisation;
    expect(company.type).to.equal(Company.COMPANY_TYPES.organisation);
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

  Object.values(Company.ORGANISATION_TYPES).forEach(type => {
    test(`can set/get organisation type to "${type}"`, async () => {
      company.organisationType = type;
      expect(company.organisationType).to.equal(type);
    });
  });

  test('throws an error if attempting to set invalid organisation type', async () => {
    try {
      company.organisationType = 'invalid-type';
      fail();
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set an array of company address to company addresses array', async () => {
    const companyAddresses = [new CompanyAddress(), new CompanyAddress()];
    company.companyAddresses = companyAddresses;
    expect(company.companyAddresses).to.equal(companyAddresses);
  });

  test('throws an error if attempting to set an array of the wrong types', async () => {
    try {
      company.companyAddresses = [new CompanyContact()];
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set an array of company contacts to company contacts array', async () => {
    const companyContacts = [new CompanyContact(), new CompanyContact()];
    company.companyContacts = companyContacts;
    expect(company.companyContacts).to.equal(companyContacts);
  });

  test('throws an error if attempting to set an array of the wrong types', async () => {
    try {
      company.companyContacts = [new CompanyAddress()];
    } catch (err) {
      expect(err).to.be.an.error();
    }
  });

  test('can set/get company number to a string', async () => {
    company.companyNumber = 'SL132456';
    expect(company.companyNumber).to.equal('SL132456');
  });

  test('can set/get company number to null', async () => {
    company.companyNumber = null;
    expect(company.companyNumber).to.equal(null);
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
      company.type = Company.COMPANY_TYPES.person;
      company.organisationType = Company.ORGANISATION_TYPES.individual;
    });

    test('.toJSON returns all data', async () => {
      const data = company.toJSON();
      expect(data).to.equal({
        id: TEST_GUID,
        name: TEST_NAME,
        type: Company.COMPANY_TYPES.person,
        organisationType: Company.ORGANISATION_TYPES.individual,
        companyAddresses: [],
        companyContacts: []
      });
    });
  });
  experiment('.isValid', () => {
    beforeEach(async () => {
      company.name = TEST_NAME;
      company.type = Company.COMPANY_TYPES.person;
      company.organisationType = Company.ORGANISATION_TYPES.individual;
    });
    experiment('type', () => {
      Object.values(Company.COMPANY_TYPES).forEach(type => {
        test(`can be set to ${type}`, async () => {
          company.type = type;

          const { error, value } = company.isValid();
          expect(error).to.be.false();
          expect(value.type).to.equal(type);
        });
      });
    });

    experiment('organisation type', () => {
      Object.values(Company.ORGANISATION_TYPES).forEach(type => {
        test(`can be set to ${type}`, async () => {
          company.organisationType = type;

          const { error, value } = company.isValid();
          expect(error).to.be.false();
          expect(value.organisationType).to.equal(type);
        });
      });
    });

    experiment('name', () => {
      test('is valid when present', async () => {
        const { error, value } = company.isValid();
        expect(error).to.be.false();
        expect(value.name).to.equal(company.name);
      });
    });

    experiment('companyNumber', () => {
      test('is optional', async () => {
        delete company.companyNumber;

        const { error } = company.isValid();
        expect(error).to.be.false();
      });

      test('must have a length of 8', async () => {
        company.companyNumber = 'ABC123';

        const { error } = company.isValid();
        expect(error).to.not.be.null();
      });

      test('is valid when present', async () => {
        company.companyNumber = 'SL123456';
        const { error, value } = company.isValid();
        expect(error).to.be.false();
        expect(value.companyNumber).to.equal(company.companyNumber);
      });
    });
  });
});

'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const Company = require('../../../src/lib/models/company');
const companyMapper = require('../../../src/lib/mappers/company');

const dbRow = {
  companyId: '00000000-0000-0000-0000-000000000000',
  name: 'company name',
  type: 'organisation',
  organisationType: 'limitedCompany'
};

const companyData = {
  name: 'company name',
  type: 'individual'
};

experiment('modules/billing/mappers/company', () => {
  experiment('.crmToModel', () => {
    let result;

    beforeEach(async () => {
      result = companyMapper.crmToModel(dbRow);
    });

    test('returns null when data is empty', async () => {
      const result = companyMapper.crmToModel(null);
      expect(result).to.equal(null);
    });

    test('returns an Company instance', async () => {
      expect(result instanceof Company).to.be.true();
    });

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.companyId);
    });

    test('has the expected name value', async () => {
      expect(result.name).to.equal(dbRow.name);
    });

    test('has the expected type value', async () => {
      expect(result.type).to.equal(dbRow.type);
    });

    test('has the expected organisationType value', async () => {
      expect(result.organisationType).to.equal(dbRow.organisationType);
    });
  });

  experiment('.serviceToCrm', () => {
    let result;

    beforeEach(async () => {
      result = companyMapper.serviceToCrm(companyData);
    });

    test('has the expected name value', async () => {
      expect(result.name).to.equal(companyData.name);
    });

    experiment('when type = "individual', () => {
      test('has the expected type value', async () => {
        expect(result.type).to.equal('person');
      });

      test('has the expected organisation type value', async () => {
        expect(result.organisationType).to.equal(companyData.type);
      });
    });

    experiment('when type != "individual', () => {
      beforeEach(async () => {
        companyData.type = 'limitedCompany';
        result = companyMapper.serviceToCrm(companyData);
      });

      test('has the expected type value', async () => {
        expect(result.type).to.equal('organisation');
      });

      test('has the expected organisation type value', async () => {
        expect(result.organisationType).to.equal(companyData.type);
      });
    });
  });
});

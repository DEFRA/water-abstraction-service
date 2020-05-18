'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const LicenceAgreement = require('../../../src/lib/models/licence-agreement');
const DateRange = require('../../../src/lib/models/date-range');
const Agreement = require('../../../src/lib/models/agreement');
class TestModel {};

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/licence-agreement', () => {
  let licenceAgreement;

  beforeEach(async () => {
    licenceAgreement = new LicenceAgreement();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      licenceAgreement.id = TEST_GUID;
      expect(licenceAgreement.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        licenceAgreement.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.dateRange', () => {
    test('can be set to a DateRange instance', async () => {
      const dateRange = new DateRange('2019-09-01', null);
      licenceAgreement.dateRange = dateRange;
      expect(licenceAgreement.dateRange).to.equal(dateRange);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        licenceAgreement.dateRange = new TestModel();
      };
      expect(func).to.throw();
    });
  });

  experiment('.agreement', () => {
    test('can be set to a Agreement instance', async () => {
      const agreement = new Agreement();
      licenceAgreement.agreement = agreement;
      expect(licenceAgreement.agreement).to.equal(agreement);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        licenceAgreement.agreement = new TestModel();
      };
      expect(func).to.throw();
    });
  });
});

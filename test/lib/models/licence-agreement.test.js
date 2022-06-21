'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const moment = require('moment');

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

  experiment('.dateSigned', () => {
    test('can be set with an ISO date string', async () => {
      const dateString = '2020-01-20T14:51:42.024Z';
      licenceAgreement.dateSigned = dateString;
      expect(licenceAgreement.dateSigned).to.equal('2020-01-20');
    });

    test('can be set with a JS date', async () => {
      const date = new Date();
      date.setDate(4);
      date.setMonth(3);
      date.setFullYear(2020);
      licenceAgreement.dateSigned = date;
      expect(licenceAgreement.dateSigned).to.equal('2020-04-04');
    });

    test('can be set with a moment', async () => {
      licenceAgreement.dateSigned = moment('2020-02-01');
      expect(licenceAgreement.dateSigned).to.equal('2020-02-01');
    });

    test('throws for an invalid string', async () => {
      const dateString = 'not a date';
      expect(() => { licenceAgreement.dateSigned = dateString; }).to.throw();
    });

    test('throws for a boolean value', async () => {
      expect(() => { licenceAgreement.dateSigned = true; }).to.throw();
    });

    test('allows null', async () => {
      licenceAgreement.dateSigned = null;
      expect(licenceAgreement.dateSigned).to.be.null();
    });
  });
});

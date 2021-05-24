'use strict';

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const LicenceAgreementPurposeUse = require('../../../src/lib/models/licence-agreement-purpose-use');
const PurposeUse = require('../../../src/lib/models/purpose-use');
class TestModel {};

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580';

experiment('lib/models/licence-agreement-purpose', () => {
  let licenceAgreementPurposeUse;

  beforeEach(async () => {
    licenceAgreementPurposeUse = new LicenceAgreementPurposeUse();
  });

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      licenceAgreementPurposeUse.id = TEST_GUID;
      expect(licenceAgreementPurposeUse.id).to.equal(TEST_GUID);
    });

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        licenceAgreementPurposeUse.id = 'hey';
      };
      expect(func).to.throw();
    });
  });

  experiment('.purposeUse', () => {
    test('can be set to a PurposeUse instance', async () => {
      const purposeUse = new PurposeUse();
      licenceAgreementPurposeUse.purposeUse = purposeUse;
      expect(licenceAgreementPurposeUse.purposeUse).to.equal(purposeUse);
    });

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        licenceAgreementPurposeUse.purposeUse = new TestModel();
      };
      expect(func).to.throw();
    });

    test('throws an error if set to null', async () => {
      const func = () => {
        licenceAgreementPurposeUse.purposeUse = null;
      };
      expect(func).to.throw();
    });
  });
});

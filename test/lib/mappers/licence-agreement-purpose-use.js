'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const LicenceAgreementPurposeUse = require('../../../src/lib/models/licence-agreement-purpose-use');
const PurposeUse = require('../../../src/lib/models/purpose-use');

const licenceAgreementPurposeUseMapper = require('../../../src/lib/mappers/licence-agreement-purpose-use');

const dbRow = {
  licenceAgreementPurposeUseId: uuid(),
  purposeUse: {
    legacyId: '123',
    dateCreated: '2020-05-06 15:00:04.942199',
    dateUpdated: '2020-06-17 10:50:09.260824',
    description: 'Water slides',
    purposeUseId: 'e2bee7e5-923b-4f67-b163-38bc51f623c1',
    lossFactor: 'high',
    isTwoPartTariff: true
  }
};

experiment('modules/billing/mappers/licence-agreement-purpose-use', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = licenceAgreementPurposeUseMapper.dbToModel(dbRow);
    });

    test('returns a LicenceAgreementPurposeUse instance with correct ID', async () => {
      expect(result instanceof LicenceAgreementPurposeUse).to.be.true();
      expect(result.id).to.equal(dbRow.licenceAgreementPurposeUseId);
    });

    test('has a purposeUse property', async () => {
      const { purposeUse } = result;
      expect(purposeUse instanceof PurposeUse).to.be.true();
    });
  });
});

'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const moment = require('moment');

const PurposeUse = require('../../../src/lib/models/purpose-use');

const purposeUseMapper = require('../../../src/lib/mappers/purpose-use');

const dbRow = {
  legacyId: '123',
  dateCreated: '2020-05-06 15:00:04.942199',
  dateUpdated: '2020-06-17 10:50:09.260824',
  description: 'Water slides',
  purposeUseId: 'e2bee7e5-923b-4f67-b163-38bc51f623c1',
  lossFactor: 'high',
  isTwoPartTariff: true
};

experiment('lib/mappers/purpose-use', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = purposeUseMapper.dbToModel(dbRow);
    });

    test('returns a PurposeUse instance with correct ID', async () => {
      expect(result instanceof PurposeUse).to.be.true();
      expect(result.id).to.equal(dbRow.purposeUseId);
    });

    test('has a name property', async () => {
      expect(result.name).to.equal(dbRow.description);
    });

    test('has a code', async () => {
      expect(result.code).to.equal(dbRow.legacyId);
    });

    test('has a lossFactor property', async () => {
      expect(result.lossFactor).to.equal(dbRow.lossFactor);
    });

    test('has a dateUpdated property', async () => {
      expect(result.dateUpdated).to.equal(moment(dbRow.dateUpdated));
    });

    test('has a dateCreated property', async () => {
      expect(result.dateCreated).to.equal(moment(dbRow.dateCreated));
    });

    test('has an isTwoPartTariff property', async () => {
      expect(result.isTwoPartTariff).to.equal(dbRow.isTwoPartTariff);
    });
  });
});

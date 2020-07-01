'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const { expect } = require('@hapi/code');
const PurposeUse = require('../../../../src/lib/models/purpose-use');
const purposeUseMapper = require('../../../../src/modules/billing/mappers/purpose-use');

experiment('modules/billing/mappers/purpose', () => {
  experiment('.dbToModel', () => {
    let row;
    let result;

    beforeEach(async () => {
      row = {
        purposeUseId: uuid(),
        legacyId: '10',
        description: 'test-desc',
        lossFactor: 'low',
        isTwoPartTariff: false
      };

      result = purposeUseMapper.dbToModel(row);
    });

    test('creates an instance of PurposeUse', async () => {
      expect(result).to.be.an.instanceOf(PurposeUse);
    });

    test('sets the id', async () => {
      expect(result.id).to.equal(row.purposeUseId);
    });

    test('sets the code', async () => {
      expect(result.code).to.equal(row.legacyId);
    });

    test('sets the name', async () => {
      expect(result.name).to.equal(row.description);
    });

    test('sets the loss factor', async () => {
      expect(result.lossFactor).to.equal(row.lossFactor);
    });

    test('sets the isTwoPartTariff flag', async () => {
      expect(result.isTwoPartTariff).to.equal(row.isTwoPartTariff);
    });
  });
});

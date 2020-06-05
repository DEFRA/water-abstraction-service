'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const { expect } = require('@hapi/code');
const Purpose = require('../../../../src/lib/models/purpose');
const purposeMapper = require('../../../../src/modules/billing/mappers/purpose');

experiment('modules/billing/mappers/purpose', () => {
  experiment('.dbToModelUse', () => {
    let row;
    let result;

    beforeEach(async () => {
      row = {
        purposeUseId: uuid(),
        legacyId: '10',
        description: 'test-desc'
      };

      result = purposeMapper.dbToModelUse(row);
    });

    test('sets the id', async () => {
      expect(result.id).to.equal(row.purposeUseId);
    });

    test('sets the type', async () => {
      expect(result.type).to.equal(Purpose.PURPOSE_TYPES.use);
    });

    test('sets the code', async () => {
      expect(result.code).to.equal(row.legacyId);
    });

    test('sets the name', async () => {
      expect(result.name).to.equal(row.description);
    });
  });
});

'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const moment = require('moment');

const LicenceVersion = require('../../../src/lib/models/licence-version');

const licenceVersionMapper = require('../../../src/lib/mappers/licence-version');

const dbRow = {
  status: 'superseded',
  endDate: '2000-01-01',
  startDate: '1990-01-01',
  externalId: '1:11:100:0',
  dateUpdated: '2020-06-02 11:10:00.000000',
  dateCreated: '2020-06-01 11:10:00.000000',
  licenceId: '55cdc419-04f8-4844-ad09-94fe92b33453',
  licenceVersionId: '17c45db7-aeaa-4c2e-bd58-584696b56681',
  issue: 100,
  increment: 0
};

experiment('modules/billing/mappers/licence-version', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = licenceVersionMapper.dbToModel(dbRow);
    });

    test('returns a LicenceVersion instance with correct ID', async () => {
      expect(result instanceof LicenceVersion).to.be.true();
      expect(result.id).to.equal(dbRow.licenceVersionId);
    });

    test('has a status property', async () => {
      expect(result.status).to.equal(dbRow.status);
    });

    test('has an endDate property', async () => {
      expect(result.endDate).to.equal(moment(dbRow.endDate));
    });

    test('has a startDate property', async () => {
      expect(result.startDate).to.equal(moment(dbRow.startDate));
    });

    test('has an externalId property', async () => {
      expect(result.externalId).to.equal(dbRow.externalId);
    });

    test('has a dateUpdated property', async () => {
      expect(result.dateUpdated).to.equal(moment(dbRow.dateUpdated));
    });

    test('has a dateCreated property', async () => {
      expect(result.dateCreated).to.equal(moment(dbRow.dateCreated));
    });

    test('has an issue property', async () => {
      expect(result.issue).to.equal(dbRow.issue);
    });

    test('has an increment property', async () => {
      expect(result.increment).to.equal(dbRow.increment);
    });
  });
});

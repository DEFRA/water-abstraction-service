'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const ReturnRequirementVersion = require('../../../src/lib/models/return-requirement-version');
const ReturnRequirement = require('../../../src/lib/models/return-requirement');
const DateRange = require('../../../src/lib/models/date-range');

const mapper = require('../../../src/lib/mappers/return-requirement-version');

const createDBRow = () => ({
  returnVersionId: uuid(),
  version: 123,
  status: 'current',
  startDate: '2018-01-02',
  endDate: '2020-03-04',
  returnRequirements: [{
    returnRequirementId: uuid(),
    isSummer: true
  }]
});

experiment('modules/billing/mappers/return-requirement-version', () => {
  experiment('.dbToModel', () => {
    let dbRow, result;

    experiment('when there are no returnRequirements', () => {
      beforeEach(async () => {
        dbRow = createDBRow();
        delete dbRow.returnRequirements;
        result = mapper.dbToModel(dbRow);
      });

      test('returns a ReturnRequirementVersion model', async () => {
        expect(result).to.be.an.instanceof(ReturnRequirementVersion);
      });

      test('has the .id property', async () => {
        expect(result.id).to.equal(dbRow.returnVersionId);
      });

      test('has the .status property', async () => {
        expect(result.status).to.equal(dbRow.status);
      });

      test('has the .dateRange property', async () => {
        const { dateRange } = result;
        expect(dateRange).to.be.an.instanceof(DateRange);
        expect(dateRange.startDate).to.equal('2018-01-02');
        expect(dateRange.endDate).to.equal('2020-03-04');
      });

      test('has an empty array of returnRequirements', async () => {
        expect(result.returnRequirements);
      });
    });

    experiment('when there are returnRequirements', () => {
      beforeEach(async () => {
        dbRow = createDBRow();
        result = mapper.dbToModel(dbRow);
      });

      test('has an array of returnRequirements', async () => {
        expect(result.returnRequirements).to.be.an.array().length(1);
      });

      test('has the correct returnRequirements', async () => {
        const [returnRequirement] = result.returnRequirements;
        expect(returnRequirement).to.be.an.instanceof(ReturnRequirement);
        expect(returnRequirement.id).to.equal(dbRow.returnRequirements[0].returnRequirementId);
      });
    });
  });
});

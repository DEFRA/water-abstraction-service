'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const moment = require('moment');
const uuid = require('uuid/v4');

const LicenceVersionPurpose = require('../../../src/lib/models/licence-version-purpose');

const licenceVersionPurposeMapper = require('../../../src/lib/mappers/licence-version-purpose');

const dbRow = {
  licenceVersionPurposeId: uuid(),
  licenceVersionId: uuid(),
  externalId: '1:1111',
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 11,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 3,
  timeLimitedStartDate: null,
  timeLimitedEndDate: null,
  notes: 'test notes',
  annualQuantity: 23000,
  dateUpdated: '2020-01-11 00:00:00.000000',
  dateCreated: '2020-01-11 00:00:00.000000',
  scheme: 'alcs'
};

experiment('modules/billing/mappers/licence-version-purpose', () => {
  experiment('.dbToModel', () => {
    let result;

    experiment('if the data does not contain any purposes', () => {
      beforeEach(async () => {
        result = licenceVersionPurposeMapper.dbToModel(dbRow);
      });

      test('returns a LicenceVersionPurpose instance with correct ID', async () => {
        expect(result instanceof LicenceVersionPurpose).to.be.true();
        expect(result.id).to.equal(dbRow.licenceVersionPurposeId);
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

      test('contains a populated AbstractionPeriod', async () => {
        expect(result.abstractionPeriod.startDay).to.equal(dbRow.abstractionPeriodStartDay);
        expect(result.abstractionPeriod.startMonth).to.equal(dbRow.abstractionPeriodStartMonth);
        expect(result.abstractionPeriod.endDay).to.equal(dbRow.abstractionPeriodEndDay);
        expect(result.abstractionPeriod.endMonth).to.equal(dbRow.abstractionPeriodEndMonth);
      });

      test('contains a null timeLimitedPeriod', async () => {
        expect(result.timeLimitedPeriod).to.equal(null);
      });

      test('contains a populated timeLimitedPeriod when there is data', async () => {
        dbRow.timeLimitedStartDate = '2001-01-01';
        dbRow.timeLimitedEndDate = '2002-02-02';

        result = licenceVersionPurposeMapper.dbToModel(dbRow);

        expect(result.timeLimitedPeriod.startDate).to.equal(dbRow.timeLimitedStartDate);
        expect(result.timeLimitedPeriod.endDate).to.equal(dbRow.timeLimitedEndDate);
      });

      test('has the notes', async () => {
        expect(result.notes).to.equal(dbRow.notes);
      });

      test('has the annualQuantity', async () => {
        expect(result.annualQuantity).to.equal(dbRow.annualQuantity);
      });

      test('the .purposeUse property is undefined', async () => {
        expect(result.purposeUse).to.be.undefined();
      });

      test('the .purposePrimary property is undefined', async () => {
        expect(result.purposePrimary).to.be.undefined();
      });

      test('the .purposeSecondary property is undefined', async () => {
        expect(result.purposeSecondary).to.be.undefined();
      });
    });

    experiment('if the data contains a primary purpose', () => {
      beforeEach(async () => {
        dbRow.purposePrimary = {
          legacyId: '456',
          description: 'Spray Irrigation - Direct',
          dateCreated: '2020-01-01T00:00:00.000Z',
          dateUpdated: '2020-01-01T00:00:00.000Z',
          purposePrimaryId: uuid()
        };

        result = licenceVersionPurposeMapper.dbToModel(dbRow);
      });

      test('the primary purpose is added to the licence version purpose model', async () => {
        expect(result.purposePrimary.code).to.equal('456');
      });
    });

    experiment('if the data contains a secondary purpose', () => {
      beforeEach(async () => {
        dbRow.purposeSecondary = {
          legacyId: '789',
          description: 'Spray Irrigation - Direct',
          dateCreated: '2020-01-01T00:00:00.000Z',
          dateUpdated: '2020-01-01T00:00:00.000Z',
          purposeSecondaryId: uuid()
        };

        result = licenceVersionPurposeMapper.dbToModel(dbRow);
      });

      test('the secondary purpose is added to the licence version purpose model', async () => {
        expect(result.purposeSecondary.code).to.equal('789');
      });
    });

    experiment('if the data contains a purpose use', () => {
      beforeEach(async () => {
        dbRow.purposeUse = {
          legacyId: '123',
          description: 'Spray Irrigation - Direct',
          dateCreated: '2020-01-01T00:00:00.000Z',
          dateUpdated: '2020-01-01T00:00:00.000Z',
          purposeUseId: uuid(),
          lossFactor: 'high',
          isTwoPartTariff: false
        };

        result = licenceVersionPurposeMapper.dbToModel(dbRow);
      });

      test('the purpose use is added to the licence version purpose model', async () => {
        expect(result.purposeUse.lossFactor).to.equal('high');
      });
    });
  });
});

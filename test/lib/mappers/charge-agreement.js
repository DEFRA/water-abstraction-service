'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const moment = require('moment');
const { expect } = require('@hapi/code');

const ChargeAgreement = require('../../../src/lib/models/charge-agreement');
const chargeAgreementMapper = require('../../../src/lib/mappers/charge-agreement');

experiment('lib/mappers/charge-agreement', () => {
  experiment('.dbToModel', () => {
    let row;
    let result;

    beforeEach(async () => {
      row = {
        chargeAgreementId: '2467e7d6-2d9e-42c9-843e-e670011d3a76',
        chargeElementId: '01a5e49b-015f-40c8-aa8e-bbe86fed380e',
        agreementCode: 'S126',
        startDate: '2001-04-01',
        endDate: '2001-04-02',
        signedDate: null,
        fileReference: 'SummerRecord',
        description: 'test description',
        dateCreated: '2020-05-06T14:00:18.802Z',
        dateUpdated: '2020-05-16T14:00:15.484Z'
      };

      result = chargeAgreementMapper.dbToModel(row);
    });

    test('returns an instance of ChargeAgreement', async () => {
      expect(result instanceof ChargeAgreement).to.be.true();
    });

    test('sets the .code property', async () => {
      expect(result.code).to.equal(row.agreementCode);
    });

    test('sets the .startDate property', async () => {
      expect(result.startDate).to.equal(moment(row.startDate));
    });

    test('sets the .endDate property', async () => {
      expect(result.endDate).to.equal(moment(row.endDate));
    });

    test('can set the .endDate property to null', async () => {
      row.endDate = null;
      result = chargeAgreementMapper.dbToModel(row);
      expect(result.endDate).to.equal(null);
    });

    test('sets the .description property', async () => {
      expect(result.description).to.equal(row.description);
    });

    test('sets the .dateCreated property', async () => {
      expect(result.dateCreated).to.equal(moment(row.dateCreated));
    });

    test('sets the .dateUpdated property', async () => {
      expect(result.dateUpdated).to.equal(moment(row.dateUpdated));
    });
  });
});

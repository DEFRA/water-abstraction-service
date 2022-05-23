'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const Agreement = require('../../../src/lib/models/agreement');
const DateRange = require('../../../src/lib/models/date-range');
const LicenceAgreement = require('../../../src/lib/models/licence-agreement');

const licenceAgreementMapper = require('../../../src/lib/mappers/licence-agreement');

const dbRow = {
  licenceAgreementId: uuid(),
  financialAgreementType: {
    financialAgreementTypeId: uuid(),
    financialAgreementCode: 'S127'
  },
  startDate: '2019-01-01',
  endDate: '2020-02-03',
  dateSigned: '2020-05-07 08:20:03.272591'
};

experiment('modules/billing/mappers/licence-agreement', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = licenceAgreementMapper.dbToModel(dbRow);
    });

    test('returns a LicenceAgreement instance with correct ID', async () => {
      expect(result instanceof LicenceAgreement).to.be.true();
      expect(result.id).to.equal(dbRow.licenceAgreementId);
    });

    test('has a dateRange property', async () => {
      const { dateRange } = result;
      expect(dateRange instanceof DateRange).to.be.true();
      expect(dateRange.startDate).to.equal(dbRow.startDate);
      expect(dateRange.endDate).to.equal(dbRow.endDate);
    });

    test('has an agreement property', async () => {
      const { agreement } = result;
      expect(agreement instanceof Agreement).to.be.true();
      expect(agreement.code).to.equal(dbRow.financialAgreementType.financialAgreementCode);
    });

    test('maps the date signed', async () => {
      expect(result.dateSigned).to.equal('2020-05-07');
    });
  });

  experiment('.modelToDb', () => {
    let result, model;

    beforeEach(async () => {
      model = new LicenceAgreement();
      model.fromHash({
        licenceNumber: '01/123/ABC',
        dateRange: new DateRange('2020-01-01', '2020-06-01'),
        dateSigned: '2019-12-28',
        agreement: new Agreement(uuid())
      });
      result = licenceAgreementMapper.modelToDb(model);
    });

    test('maps the .licenceNumber property', async () => {
      expect(result.licenceRef).to.equal('01/123/ABC');
    });

    test('maps the .dateRange property', async () => {
      expect(result.startDate).to.equal('2020-01-01');
      expect(result.endDate).to.equal('2020-06-01');
    });

    test('maps the .dateSigned property', async () => {
      expect(result.dateSigned).to.equal('2019-12-28');
    });

    test('maps the agreement id', async () => {
      expect(result.financialAgreementTypeId).to.equal(model.agreement.id);
    });
  });
});

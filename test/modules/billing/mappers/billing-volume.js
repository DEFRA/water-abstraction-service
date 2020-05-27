'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const billingVolumeMapper = require('../../../../src/modules/billing/mappers/billing-volume');

const BillingVolume = require('../../../../src/lib/models/billing-volume');
const User = require('../../../../src/lib/models/user');
const FinancialYear = require('../../../../src/lib/models/financial-year');

experiment('modules/billing/mappers/billing-volume', () => {
  experiment('.dbToModel', () => {
    let result;

    const dbRow = {
      billingVolumeId: '2825cc00-0ecd-44b4-a88d-fd10162d9a94',
      chargeElementId: 'bf679fc9-dec9-42cd-bc32-542578be01d9',
      financialYear: 2019,
      isSummer: true,
      calculatedVolume: 23.845,
      twoPartTariffError: false,
      twoPartTariffStatus: null,
      twoPartTariffReview: { id: 1234, email: 'test@example.com' },
      isApproved: false
    };

    beforeEach(async () => {
      result = billingVolumeMapper.dbToModel(dbRow);
    });

    test('should return a BillingVolume model', async () => {
      expect(result instanceof BillingVolume).to.be.true();
    });

    test('should have data mapped correctly', async () => {
      expect(result.id).to.equal(dbRow.billingVolumeId);
      expect(result.chargeElementId).to.equal(dbRow.chargeElementId);
      expect(result.isSummer).to.equal(dbRow.isSummer);
      expect(result.calculatedVolume).to.equal(dbRow.calculatedVolume);
      expect(result.twoPartTariffError).to.equal(dbRow.twoPartTariffError);
      expect(result.twoPartTariffStatus).to.equal(dbRow.twoPartTariffStatus);
      expect(result.isApproved).to.equal(dbRow.isApproved);
    });

    test('sets the financialYear to a FinancialYear instance', async () => {
      expect(result.financialYear).to.be.instanceOf(FinancialYear);
      expect(result.financialYear.yearEnding).to.equal(dbRow.financialYear);
    });

    test('sets the twoPartTariffReview to a User instance', async () => {
      expect(result.twoPartTariffReview).to.be.instanceOf(User);
      expect(result.twoPartTariffReview.id).to.equal(dbRow.twoPartTariffReview.id);
      expect(result.twoPartTariffReview.email).to.equal(dbRow.twoPartTariffReview.email);
    });

    test('handles null twoPartTariffReview', async () => {
      result = billingVolumeMapper.dbToModel({
        ...dbRow,
        twoPartTariffReview: null
      });
      expect(result.twoPartTariffReview).to.be.null();
    });
  });
});

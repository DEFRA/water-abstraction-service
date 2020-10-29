'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const billingVolumeMapper = require('../../../../src/modules/billing/mappers/billing-volume');

const BillingVolume = require('../../../../src/lib/models/billing-volume');
const User = require('../../../../src/lib/models/user');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const ChargeElement = require('../../../../src/lib/models/charge-element');

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
      isApproved: false,
      volume: 12.79
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
      expect(result.volume).to.equal(dbRow.volume);
      expect(result.chargeElement).to.be.undefined();
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

    experiment('when charge element info is specified', () => {
      beforeEach(async () => {
        dbRow.chargeElement = {
          chargeElementId: uuid(),
          source: 'supported',
          season: 'summer',
          loss: 'high',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 1,
          abstractionPeriodEndDay: 31,
          abstractionPeriodEndMonth: 12,
          description: 'Test element',
          authorisedAnnualQuantity: 3.5,
          billableAnnualQuantity: 2.5
        };
        result = billingVolumeMapper.dbToModel(dbRow);
      });

      test('the result includes a ChargeElement model', async () => {
        expect(result.chargeElement).to.be.instanceOf(ChargeElement);
      });
    });
  });

  experiment('.matchingResultsToDb', () => {
    const chargeElementId = '29328315-9b24-473b-bde7-02c60e881501';
    let matchingResults, result;
    experiment('when there are no errors', async () => {
      beforeEach(() => {
        matchingResults = {
          error: null,
          data: [{
            error: null,
            data: {
              chargeElementId,
              actualReturnQuantity: 42.35
            }
          }]
        };

        result = billingVolumeMapper.matchingResultsToDb(matchingResults, 2019, true);
      });

      test('includes charge element id', async () => {
        expect(result[0].chargeElementId).to.equal(matchingResults.data[0].data.chargeElementId);
      });

      test('maps actual return quantity to calculated volume', async () => {
        expect(result[0].calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      });

      test('maps actual return quantity to volume', async () => {
        expect(result[0].volume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      });

      test('sets two part tariff status to null', async () => {
        expect(result[0].twoPartTariffStatus).to.be.null();
      });

      test('sets two part tariff error to false', async () => {
        expect(result[0].twoPartTariffError).to.be.false();
      });

      test('includes financial year', async () => {
        expect(result[0].financialYear).to.equal(2019);
      });

      test('includes isSumer flag', async () => {
        expect(result[0].isSummer).to.be.true();
      });

      test('sets isApproved flag to false', async () => {
        expect(result[0].isApproved).to.be.false();
      });
    });

    experiment('when there is a charge element specific error', async () => {
      beforeEach(() => {
        matchingResults = {
          error: null,
          data: [{
            error: 30,
            data: {
              chargeElementId,
              actualReturnQuantity: 65.7
            }
          }]
        };

        result = billingVolumeMapper.matchingResultsToDb(matchingResults, 2019, false);
      });

      test('includes charge element id', async () => {
        expect(result[0].chargeElementId).to.equal(matchingResults.data[0].data.chargeElementId);
      });

      test('maps actual return quantity to calculated volume', async () => {
        expect(result[0].calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      });

      test('sets two part tariff status to error code', async () => {
        expect(result[0].twoPartTariffStatus).to.equal(30);
      });

      test('sets two part tariff error to true', async () => {
        expect(result[0].twoPartTariffError).to.be.true();
      });

      test('includes financial year', async () => {
        expect(result[0].financialYear).to.equal(2019);
      });

      test('includes isSumer flag', async () => {
        expect(result[0].isSummer).to.be.false();
      });

      test('sets isApproved flag to false', async () => {
        expect(result[0].isApproved).to.be.false();
      });
    });

    experiment('when there is an overall error', async () => {
      experiment('and data is null', () => {
        beforeEach(() => {
          matchingResults = {
            error: 70,
            data: [{
              error: null,
              data: {
                chargeElementId,
                actualReturnQuantity: null
              }
            }]
          };

          result = billingVolumeMapper.matchingResultsToDb(matchingResults, 2019, true);
        });

        test('includes charge element id', async () => {
          expect(result[0].chargeElementId).to.equal(matchingResults.data[0].data.chargeElementId);
        });

        test('maps actual return quantity to calculated volume', async () => {
          expect(result[0].calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
        });

        test('sets two part tariff status to error code', async () => {
          expect(result[0].twoPartTariffStatus).to.equal(70);
        });

        test('sets two part tariff error to true', async () => {
          expect(result[0].twoPartTariffError).to.be.true();
        });

        test('includes financial year', async () => {
          expect(result[0].financialYear).to.equal(2019);
        });

        test('includes isSumer flag', async () => {
          expect(result[0].isSummer).to.be.true();
        });

        test('sets isApproved flag to false', async () => {
          expect(result[0].isApproved).to.be.false();
        });
      });

      experiment('and there is a charge element specific error', () => {
        beforeEach(() => {
          matchingResults = {
            error: 70,
            data: [{
              error: 30,
              data: {
                chargeElementId,
                actualReturnQuantity: 65.7
              }
            }]
          };

          result = billingVolumeMapper.matchingResultsToDb(matchingResults, 2019, true);
        });

        test('includes charge element id', async () => {
          expect(result[0].chargeElementId).to.equal(matchingResults.data[0].data.chargeElementId);
        });

        test('maps actual return quantity to calculated volume', async () => {
          expect(result[0].calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
        });

        test('sets two part tariff status to overall error code', async () => {
          expect(result[0].twoPartTariffStatus).to.equal(70);
        });

        test('sets two part tariff error to true', async () => {
          expect(result[0].twoPartTariffError).to.be.true();
        });

        test('includes financial year', async () => {
          expect(result[0].financialYear).to.equal(2019);
        });

        test('includes isSumer flag', async () => {
          expect(result[0].isSummer).to.be.true();
        });

        test('sets isApproved flag to false', async () => {
          expect(result[0].isApproved).to.be.false();
        });
      });
    });
  });

  experiment('.modelToDb', () => {
    let billingVolume, result;

    beforeEach(async () => {
      const financialYear = new FinancialYear(2020);
      billingVolume = new BillingVolume(uuid());
      billingVolume.fromHash({
        billingBatchId: uuid(),
        chargeElementId: uuid(),
        chargeElement: new ChargeElement(),
        isSummer: true,
        calculatedVolume: 12.5,
        twoPartTariffError: true,
        twoPartTariffStatus: 10,
        isApproved: false,
        volume: 10.2,
        financialYear
      });

      result = billingVolumeMapper.modelToDb(billingVolume);
    });

    test('the data should be mapped to the DB fields', async () => {
      const { billingVolumeId, billingBatchId, chargeElementId, ...rest } = result;
      expect(billingVolumeId).to.equal(billingVolume.id);
      expect(chargeElementId).to.equal(billingVolume.chargeElementId);
      expect(billingBatchId).to.equal(billingVolume.billingBatchId);
      expect(rest).to.equal({
        isSummer: true,
        calculatedVolume: 12.5,
        twoPartTariffError: true,
        twoPartTariffStatus: 10,
        isApproved: false,
        volume: 10.2,
        financialYear: 2020
      });
    });

    experiment('when there is a two-part tariff reviewer', () => {
      beforeEach(async () => {
        const user = new User();
        user.fromHash({
          id: 123,
          email: 'nobody@example.com'
        });
        billingVolume.twoPartTariffReview = user;
        result = billingVolumeMapper.modelToDb(billingVolume);
      });

      test('the twoPartTariffReview property contains the reviewer user details', async () => {
        expect(result.twoPartTariffReview.id).to.equal(123);
        expect(result.twoPartTariffReview.email).to.equal('nobody@example.com');
      });
    });
  });
});

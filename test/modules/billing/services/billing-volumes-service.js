const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { omit } = require('lodash');

const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');

const BillingVolume = require('../../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const billingVolumesRepo = require('../../../../src/lib/connectors/repos/billing-volumes');
const mappers = require('../../../../src/modules/billing/mappers');
const twoPartTariffMatching = require('../../../../src/modules/billing/services/two-part-tariff-service');

const createChargeVersion = chargeElements => ({
  licenceRef: '1/23/456',
  chargeElements
});

const createBillingVolumeData = (idSuffix, financialYear, isSummer, data = {}) => ({
  billingVolumeId: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa${idSuffix}`,
  chargeElementId: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb${idSuffix}`,
  financialYear,
  isSummer,
  ...data
});

const createBillingVolume = data => {
  const billingVolume = new BillingVolume();
  return billingVolume.fromHash({
    ...omit(data, 'billingVolumeId'),
    financialYear: new FinancialYear(data.financialYear)
  });
};

experiment('modules/billing/services/billing-volumes-service', () => {
  beforeEach(async () => {
    sandbox.stub(billingVolumesRepo, 'find');
    sandbox.stub(billingVolumesRepo, 'create');
    sandbox.stub(mappers.billingVolume, 'dbToModel');
    sandbox.stub(twoPartTariffMatching, 'calculateVolumes');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getVolumes', () => {
    experiment('when calculated volumes exist', () => {
      let billingVolumes, result;

      beforeEach(async () => {
        billingVolumes = [
          createBillingVolumeData(1, 2019, true),
          createBillingVolumeData(2, 2019, false),
          createBillingVolumeData(3, 2020, true)
        ];
        const chargeElements = [
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' },
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2' },
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3' }];

        const billingVolume = createBillingVolume(billingVolumes[0]);
        mappers.billingVolume.dbToModel.returns(billingVolume);
        billingVolumesRepo.find.resolves(billingVolumes);

        result = await billingVolumesService.getVolumes(createChargeVersion(chargeElements), 2019, true);
      });

      test('calls repo with charge element ids', async () => {
        expect(billingVolumesRepo.find.calledWith([
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
        ])).to.be.true();
      });

      test('calls mapper with billing volumes to be returned', async () => {
        expect(mappers.billingVolume.dbToModel.calledWith(
          billingVolumes[0]
        )).to.be.true();
      });

      test('only returns volumes relevant to financial year and season', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
        expect(result[0].financialYear.yearEnding).to.equal(2019);
        expect(result[0].isSummer).to.be.true();
      });
    });

    experiment('when billing volumes need to be calculated', () => {
      let chargeVersion, result;

      const matchingResults = {
        error: null,
        data: [{
          error: null,
          data: {
            chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
            actualReturnQuantity: 25
          }
        }, {
          error: 30,
          data: {
            chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
            actualReturnQuantity: 60
          }
        }]
      };

      const billingVolumesData = [
        createBillingVolumeData(1, 2019, true, {
          calculatedVolume: 25,
          twoPartTariffStatus: null,
          twoPartTariffError: false,
          isApproved: false
        }),
        createBillingVolumeData(2, 2019, true, {
          calculatedVolume: 60,
          twoPartTariffStatus: 30,
          twoPartTariffError: true,
          isApproved: false
        })
      ];
      beforeEach(async () => {
        const chargeElements = [
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1' },
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2' },
          { chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3' }];

        billingVolumesRepo.find.resolves([]);
        twoPartTariffMatching.calculateVolumes.resolves(matchingResults);
        billingVolumesRepo.create
          .onFirstCall().resolves(billingVolumesData[0])
          .onSecondCall().resolves(billingVolumesData[1]);

        mappers.billingVolume.dbToModel
          .onFirstCall().returns(createBillingVolume(createBillingVolume(billingVolumesData[0])))
          .onSecondCall().returns(createBillingVolume(createBillingVolume(billingVolumesData[1])));

        chargeVersion = createChargeVersion(chargeElements);
        result = await billingVolumesService.getVolumes(chargeVersion, 2019, true);
      });

      test('calls repo with charge element ids', async () => {
        expect(billingVolumesRepo.find.calledWith([
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3'
        ])).to.be.true();
      });

      test('calls two part tariff matching algorithm with correct params', async () => {
        expect(twoPartTariffMatching.calculateVolumes.calledWith(
          chargeVersion,
          2019,
          true
        )).to.be.true();
      });

      test('calls repo to persist each volume', async () => {
        expect(billingVolumesRepo.create.callCount).to.equal(2);
      });

      experiment('calls repo with correct data', () => {
        test('first call', async () => {
          const [firstCall] = billingVolumesRepo.create.firstCall.args;
          expect(firstCall.chargeElementId).to.equal(billingVolumesData[0].chargeElementId);
          expect(firstCall.financialYear).to.equal(billingVolumesData[0].financialYear);
          expect(firstCall.isSummer).to.equal(billingVolumesData[0].isSummer);
          expect(firstCall.calculatedVolume).to.equal(billingVolumesData[0].calculatedVolume);
          expect(firstCall.twoPartTariffStatus).to.equal(billingVolumesData[0].twoPartTariffStatus);
          expect(firstCall.twoPartTariffError).to.equal(billingVolumesData[0].twoPartTariffError);
          expect(firstCall.isApproved).to.equal(billingVolumesData[0].isApproved);
        });

        test('second call', async () => {
          const [secondCall] = billingVolumesRepo.create.secondCall.args;
          expect(secondCall.chargeElementId).to.equal(billingVolumesData[1].chargeElementId);
          expect(secondCall.financialYear).to.equal(billingVolumesData[1].financialYear);
          expect(secondCall.isSummer).to.equal(billingVolumesData[1].isSummer);
          expect(secondCall.calculatedVolume).to.equal(billingVolumesData[1].calculatedVolume);
          expect(secondCall.twoPartTariffStatus).to.equal(billingVolumesData[1].twoPartTariffStatus);
          expect(secondCall.twoPartTariffError).to.equal(billingVolumesData[1].twoPartTariffError);
          expect(secondCall.isApproved).to.equal(billingVolumesData[1].isApproved);
        });
      });

      test('calls mapper for each billing volumes to be returned', async () => {
        expect(mappers.billingVolume.dbToModel.callCount).to.equal(2);
        expect(
          mappers.billingVolume.dbToModel.firstCall.args[0].chargeElementId
        ).to.equal(billingVolumesData[0].chargeElementId);
        expect(
          mappers.billingVolume.dbToModel.secondCall.args[0].chargeElementId
        ).to.equal(billingVolumesData[1].chargeElementId);
      });

      test('returns BillingVolume models', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal(billingVolumesData[0].chargeElementId);
        expect(result[1]).to.be.instanceOf(BillingVolume);
        expect(result[1].chargeElementId).to.equal(billingVolumesData[1].chargeElementId);
      });
    });
  });
});

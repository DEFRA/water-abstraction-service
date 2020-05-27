const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { omit } = require('lodash');

const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');

const BillingVolume = require('../../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const ChargeVersion = require('../../../../src/lib/models/charge-version');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const Licence = require('../../../../src/lib/models/licence');
const billingVolumesRepo = require('../../../../src/lib/connectors/repos/billing-volumes');
const { NotFoundError } = require('../../../../src/lib/errors');
const mappers = require('../../../../src/modules/billing/mappers');
const twoPartTariffMatching = require('../../../../src/modules/billing/services/two-part-tariff-service');

const createChargeElement = data => {
  const chargeElement = new ChargeElement();
  return chargeElement.fromHash({
    ...data
  });
};

const createLicence = () => {
  const licence = new Licence();
  return licence.fromHash({ licenceNumber: '1/23/456' });
};

const createChargeVersion = chargeElements => {
  const chargeVersion = new ChargeVersion();
  return chargeVersion.fromHash({
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    licence: createLicence(),
    chargeElements: chargeElements.map(createChargeElement)
  });
};

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
    sandbox.stub(billingVolumesRepo, 'findByChargeElementIdsAndFinancialYear');
    sandbox.stub(billingVolumesRepo, 'create');
    sandbox.stub(mappers.billingVolume, 'dbToModel');
    sandbox.stub(twoPartTariffMatching, 'calculateVolumes');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getVolumes', () => {
    experiment('when calculated volumes exist', () => {
      let billingVolumesData, result;

      beforeEach(async () => {
        billingVolumesData = [
          createBillingVolumeData(1, 2019, true),
          createBillingVolumeData(2, 2019, true)
        ];
        const chargeElements = [
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', season: 'all year' }];
        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves(billingVolumesData);

        mappers.billingVolume.dbToModel
          .onFirstCall().returns(createBillingVolume(billingVolumesData[0]))
          .onSecondCall().returns(createBillingVolume(billingVolumesData[1]));

        result = await billingVolumesService.getVolumes(createChargeVersion(chargeElements), 2019, true);
      });

      test('calls repo.findByChargeElementIdsAndFinancialYear() with correct params', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('calls mapper with billing volumes to be returned', async () => {
        expect(mappers.billingVolume.dbToModel.calledWith(
          billingVolumesData[0]
        )).to.be.true();
      });

      test('only returns volumes relevant to financial year and season', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
        expect(result[0].financialYear.yearEnding).to.equal(2019);
        expect(result[0].isSummer).to.be.true();

        expect(result[1]).to.be.instanceOf(BillingVolume);
        expect(result[1].chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
        expect(result[1].financialYear.yearEnding).to.equal(2019);
        expect(result[1].isSummer).to.be.true();
      });
    });

    experiment('when no billing volumes are found in db', () => {
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
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' }];

        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves([]);

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

      test('calls repo.findByChargeElementIdsAndFinancialYear() with correct params', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('calls two part tariff matching algorithm with correct params', async () => {
        expect(twoPartTariffMatching.calculateVolumes.calledWith(
          chargeVersion,
          2019,
          true
        )).to.be.true();
      });

      test('calls repo.create() to persist each volume', async () => {
        expect(billingVolumesRepo.create.callCount).to.equal(2);
      });

      experiment('calls repo.create() with correct data', () => {
        test('first call', async () => {
          const [firstCall] = billingVolumesRepo.create.firstCall.args;
          expect(firstCall.chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
          expect(firstCall.financialYear).to.equal(2019);
          expect(firstCall.isSummer).to.equal(true);
          expect(firstCall.calculatedVolume).to.equal(25);
          expect(firstCall.twoPartTariffStatus).to.equal(null);
          expect(firstCall.twoPartTariffError).to.equal(false);
          expect(firstCall.isApproved).to.equal(false);
        });

        test('second call', async () => {
          const [secondCall] = billingVolumesRepo.create.secondCall.args;
          expect(secondCall.chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
          expect(secondCall.financialYear).to.equal(2019);
          expect(secondCall.isSummer).to.equal(true);
          expect(secondCall.calculatedVolume).to.equal(60);
          expect(secondCall.twoPartTariffStatus).to.equal(30);
          expect(secondCall.twoPartTariffError).to.equal(true);
          expect(secondCall.isApproved).to.equal(false);
        });
      });

      test('calls mapper for each billing volume to be returned', async () => {
        const [{ chargeElementId: firstChargeElementId }] = mappers.billingVolume.dbToModel.firstCall.args;
        const [{ chargeElementId: secondChargeElementId }] = mappers.billingVolume.dbToModel.secondCall.args;
        expect(mappers.billingVolume.dbToModel.callCount).to.equal(2);
        expect(firstChargeElementId).to.equal(billingVolumesData[0].chargeElementId);
        expect(secondChargeElementId).to.equal(billingVolumesData[1].chargeElementId);
      });

      test('returns BillingVolume models', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal(billingVolumesData[0].chargeElementId);
        expect(result[1]).to.be.instanceOf(BillingVolume);
        expect(result[1].chargeElementId).to.equal(billingVolumesData[1].chargeElementId);
      });
    });

    experiment('when some billing volumes are missing', () => {
      let chargeElements;

      beforeEach(async () => {
        const billingVolumes = [
          createBillingVolumeData(1, 2019, true)
        ];
        chargeElements = [
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' }];

        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves(billingVolumes);

        try {
          await billingVolumesService.getVolumes(createChargeVersion(chargeElements), 2019, true);
        } catch (err) {}
      });

      test('calls repo.findByChargeElementIdsAndFinancialYear() with correct params', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('an error is thrown ', async () => {
        try {
          await billingVolumesService.getVolumes(createChargeVersion(chargeElements), 2019, true);
        } catch (err) {
          expect(err).to.be.instanceOf(NotFoundError);
          expect(err.message).to.equal('Billing volumes missing for charge version cccccccc-cccc-cccc-cccc-cccccccccccc');
        }
      });
    });
  });
});

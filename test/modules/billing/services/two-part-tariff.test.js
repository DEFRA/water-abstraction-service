const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { v4: uuid } = require('uuid')

const Batch = require('../../../../src/lib/models/batch')
const BillingVolume = require('../../../../src/lib/models/billing-volume')
const { TRANSACTION_TYPE } = require('../../../../src/lib/models/charge-version-year')

const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year')
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service')
const volumeMatchingService = require('../../../../src/modules/billing/services/volume-matching-service')
const twoPartTariffService = require('../../../../src/modules/billing/services/two-part-tariff.js')

const billingVolumes = [
  new BillingVolume(uuid()),
  new BillingVolume(uuid()),
  new BillingVolume(uuid()),
  new BillingVolume(uuid()),
  new BillingVolume(uuid()),
  new BillingVolume(uuid())
]

experiment('modules/billing/services/two-part-tariff.js', () => {
  beforeEach(async () => {
    sandbox.stub(chargeVersionYearService, 'getForBatch')
    sandbox.stub(chargeVersionYearService, 'getTwoPartTariffForBatch')

    sandbox.stub(volumeMatchingService, 'matchVolumes')

    for (let i = 0; i < 6; i++) {
      volumeMatchingService.matchVolumes.onCall(i).resolves([
        billingVolumes[i]
      ])
    }

    sandbox.stub(billingVolumesService, 'persist')
    sandbox.stub(billingVolumesService, 'getBillingVolumesByChargeVersion').resolves([])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.processBatch', () => {
    const batch = new Batch(uuid())
    const tempTestId1 = uuid()
    const tempTestId2 = uuid()

    experiment('for a two-part tariff batch', () => {
      const chargeVersionYears = [{
        chargeVersionId: tempTestId1,
        financialYearEnding: 2020,
        billingBatchId: batch.id,
        transactionType: TRANSACTION_TYPE.twoPartTariff,
        isSummer: false
      },
      {
        chargeVersionId: tempTestId2,
        financialYearEnding: 2020,
        billingBatchId: batch.id,
        transactionType: TRANSACTION_TYPE.twoPartTariff,
        isSummer: false
      }]

      beforeEach(async () => {
        batch.type = Batch.BATCH_TYPE.twoPartTariff
        chargeVersionYearService.getForBatch.resolves(chargeVersionYears)
        await twoPartTariffService.processBatch(batch)
      })

      test('all charge version years are loaded for the batch', async () => {
        expect(chargeVersionYearService.getForBatch.calledWith(batch.id)).to.be.true()
      })

      test('matching takes place for each charge version year', async () => {
        expect(volumeMatchingService.matchVolumes.callCount).to.equal(2)
      })

      test('the first charge element year is matched', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.firstCall.args

        expect(id).to.equal(tempTestId1)
        expect(financialYear.endYear).to.equal(2020)
        expect(isSummer).to.equal(false)
      })

      test('the second charge element year is matched', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.secondCall.args
        expect(id).to.equal(tempTestId2)
        expect(financialYear.endYear).to.equal(2020)
        expect(isSummer).to.equal(false)
      })

      test('the volumes are persisted', async () => {
        expect(billingVolumesService.persist.callCount).to.equal(2)

        expect(billingVolumesService.persist.calledWith(
          billingVolumes[0]
        )).to.be.true()

        expect(billingVolumesService.persist.calledWith(
          billingVolumes[1]
        )).to.be.true()
      })
    })

    experiment('for a supplementary batch', () => {
      const chargeVersionYears = [
        {
          chargeVersionId: tempTestId1,
          financialYearEnding: 2019,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: true
        },
        {
          chargeVersionId: tempTestId2,
          financialYearEnding: 2019,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: true
        },
        {
          chargeVersionId: tempTestId1,
          financialYearEnding: 2019,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: false
        },
        {
          chargeVersionId: tempTestId2,
          financialYearEnding: 2019,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: false
        },
        {
          chargeVersionId: tempTestId1,
          financialYearEnding: 2020,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: true
        },
        {
          chargeVersionId: tempTestId2,
          financialYearEnding: 2020,
          billingBatchId: batch.id,
          transactionType: TRANSACTION_TYPE.twoPartTariff,
          isSummer: true
        }
      ]

      beforeEach(async () => {
        batch.type = Batch.BATCH_TYPE.supplementary
        chargeVersionYearService.getTwoPartTariffForBatch.resolves(chargeVersionYears)
        await twoPartTariffService.processBatch(batch)
      })

      test('all charge version years are loaded for the batch', async () => {
        expect(chargeVersionYearService.getTwoPartTariffForBatch.calledWith(batch.id)).to.be.true()
      })

      test('matching occurs for each charge version year where a two-part tariff run has already been run', async () => {
        expect(volumeMatchingService.matchVolumes.callCount).to.equal(6)
      })

      test('the first charge element year is matched in summer 2019', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(0).args

        expect(id).to.equal(tempTestId1)
        expect(financialYear.endYear).to.equal(2019)
        expect(isSummer).to.equal(true)
      })

      test('the second charge element year is matched in summer 2019', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(1).args

        expect(id).to.equal(tempTestId2)
        expect(financialYear.endYear).to.equal(2019)
        expect(isSummer).to.equal(true)
      })

      test('the first charge element year is matched in winter 2019', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(2).args

        expect(id).to.equal(tempTestId1)
        expect(financialYear.endYear).to.equal(2019)
        expect(isSummer).to.equal(false)
      })

      test('the second charge element year is matched in winter 2019', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(3).args

        expect(id).to.equal(tempTestId2)
        expect(financialYear.endYear).to.equal(2019)
        expect(isSummer).to.equal(false)
      })

      test('the first charge element year is matched in summer 2020', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(4).args

        expect(id).to.equal(tempTestId1)
        expect(financialYear.endYear).to.equal(2020)
        expect(isSummer).to.equal(true)
      })

      test('the second charge element year is matched in summer 2020', async () => {
        const [id, financialYear, isSummer] = volumeMatchingService.matchVolumes.getCall(5).args

        expect(id).to.equal(tempTestId2)
        expect(financialYear.endYear).to.equal(2020)
        expect(isSummer).to.equal(true)
      })

      test('the volumes are persisted', async () => {
        expect(billingVolumesService.persist.callCount).to.equal(6)
      })
    })
  })
})

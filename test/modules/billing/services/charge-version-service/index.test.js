'use strict'

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const repos = require('../../../../../src/lib/connectors/repos')
const chargeVersionYearService = require('../../../../../src/modules/billing/services/charge-version-year')
const chargeVersionService = require('../../../../../src/modules/billing/services/charge-version-service')
const twoPartTariffSeasonsService = require('../../../../../src/modules/billing/services/charge-version-service/two-part-tariff-seasons')
const batchService = require('../../../../../src/modules/billing/services/batch-service')
const chargeVersionServices = require('../../../../../src/lib/services/charge-versions')
const Batch = require('../../../../../src/lib/models/batch')
const FinancialYear = require('../../../../../src/lib/models/financial-year')
const Region = require('../../../../../src/lib/models/region')
const LicenceAgreement = require('../../../../../src/lib/models/licence-agreement')
const Agreement = require('../../../../../src/lib/models/agreement')
const Licence = require('../../../../../src/lib/models/licence')
const ChargeVersion = require('../../../../../src/lib/models/charge-version')
const DateRange = require('../../../../../src/lib/models/date-range')
const { TRANSACTION_TYPE } = require('../../../../../src/lib/models/charge-version-year')
const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants')

const licenceId = uuid()
const chargeVersionId = uuid()
const licenceAgreementId = uuid()
const agreementId = uuid()

const createChargeVersionRow = (options = {}, finYearEnding = 2022) => {
  const chargeVersion = new ChargeVersion(chargeVersionId)
  const agreement = new Agreement(agreementId)
  const licence = new Licence(licenceId)
  agreement.code = 'S127'
  const licenceAgreement = new LicenceAgreement(licenceAgreementId)
  licenceAgreement.fromHash({
    dateRange: new DateRange('2017-04-01'),
    dateDeleted: null,
    agreement
  })

  licence.fromHash({
    licenceAgreements: [licenceAgreement]
  })
  const dateRange = new DateRange(`${finYearEnding - 1}-04-01`, `${finYearEnding}-03-31`)

  chargeVersion.fromHash({
    chargeVersionId,
    licenceId,
    licence,
    includeInSupplementaryBilling: false,
    isTwoPartTariff: false,
    dateRange,
    isChargeable: true,
    ...options
  })
  return chargeVersion
}

const createBatch = (type, isSummer = false) => new Batch().fromHash({
  type,
  startYear: new FinancialYear(type === Batch.BATCH_TYPE.supplementary ? 2021 : 2022),
  endYear: new FinancialYear(2022),
  region: new Region(uuid()),
  isSummer
})

experiment('modules/billing/services/charge-version-service', () => {
  let batch

  beforeEach(async () => {
    sandbox.stub(repos.chargeVersions, 'findValidInRegionAndFinancialYear')
    sandbox.stub(chargeVersionYearService, 'createBatchChargeVersionYear')
    sandbox.stub(chargeVersionServices, 'getByChargeVersionId').resolves(createChargeVersionRow())
    sandbox.stub(repos.chargeVersions, 'findOne').resolves({})
    sandbox.stub(batchService, 'getSentTptBatchesForFinancialYearAndRegion').resolves([{ type: 'two_part_tariff', isSummer: true }, { type: 'two_part_tariff', isSummer: false }])

    sandbox.stub(twoPartTariffSeasonsService, 'getTwoPartTariffSeasonsForChargeVersion').resolves({
      [RETURN_SEASONS.summer]: true,
      [RETURN_SEASONS.winterAllYear]: true
    })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createForBatch', () => {
    experiment('for an annual bill run', () => {
      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          createChargeVersionRow()
        ])

        batch = createBatch(Batch.BATCH_TYPE.annual)

        await chargeVersionService.createForBatch(batch)
      })

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1)
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true()
      })

      test('creates expected charge version years', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1)
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true()
      })
    })

    experiment('for a winter/all year TPT bill run', () => {
      const chargeVersionRow = createChargeVersionRow()

      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          chargeVersionRow
        ])

        batch = createBatch(Batch.BATCH_TYPE.twoPartTariff)

        await chargeVersionService.createForBatch(batch)
      })

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1)
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true()
      })

      test('calls the TPT service with the charge version row', async () => {
        expect(twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.calledWith(
          chargeVersionRow
        )).to.be.true()
      })

      test('creates the charge version year relating to the batch', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1)
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, false
        )).to.be.true()
      })
    })

    experiment('for a summer TPT bill run', () => {
      const chargeVersionRow = createChargeVersionRow()

      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          chargeVersionRow
        ])

        batch = createBatch(Batch.BATCH_TYPE.twoPartTariff, true)

        await chargeVersionService.createForBatch(batch)
      })

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1)
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true()
      })

      test('calls the TPT service with the charge version row', async () => {
        expect(twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.calledWith(
          chargeVersionRow
        )).to.be.true()
      })

      test('creates the charge version year relating to the batch', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1)
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, true
        )).to.be.true()
      })
    })

    experiment('for a supplementary bill run', () => {
      beforeEach(async () => {
        batch = createBatch(Batch.BATCH_TYPE.supplementary)
      })

      experiment('when the licence is not flagged for supplementary billing', () => {
        const chargeVersionRows = [
          createChargeVersionRow({
            includeInSupplementaryBilling: false
          }, 2021),
          createChargeVersionRow({
            includeInSupplementaryBilling: false
          }, 2022)
        ]

        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
            chargeVersionRows[0]
          ])
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
            chargeVersionRows[1]
          ])
          await chargeVersionService.createForBatch(batch)
        })

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false()
        })
      })

      experiment('when the licence is flagged for supplementary billing', () => {
        const chargeVersionRows = [
          createChargeVersionRow({
            includeInSupplementaryBilling: true
          }, 2021),
          createChargeVersionRow({
            includeInSupplementaryBilling: true
          }, 2022)
        ]

        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
            chargeVersionRows[0]
          ])
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
            chargeVersionRows[1]
          ])
          repos.chargeVersions.findOne.resolves(createChargeVersionRow())

          await chargeVersionService.createForBatch(batch)
        })

        test('creates the expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(6)
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
          )).to.be.true()
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true()
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true()
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.annual, false
          )).to.be.true()
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true()
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true()
        })
      })
    })
  })

  experiment('._getAnnualTransactionTypes', () => {
    test('the correct object is returned', async () => {
      const result = chargeVersionService._getAnnualTransactionTypes()
      expect(result).to.equal({
        types: [{
          type: TRANSACTION_TYPE.annual,
          isSummer: false
        }],
        chargeVersionHasAgreement: false
      })
    })
  })
  experiment('._getTwoPartTariffTransactionTypes', () => {
    const chargeVersion = createChargeVersionRow()
    test('when th batch is summer', async () => {
      twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.resolves({
        [RETURN_SEASONS.summer]: true,
        [RETURN_SEASONS.winterAllYear]: true
      })
      const result = await chargeVersionService._getTwoPartTariffTransactionTypes({ isSummer: true }, chargeVersion)
      expect(result).to.equal({
        types: [{ type: TRANSACTION_TYPE.twoPartTariff, isSummer: true }],
        chargeVersionHasAgreement: true
      })
    })
    test('when the batch is winter/all year', async () => {
      twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.resolves({
        [RETURN_SEASONS.summer]: true,
        [RETURN_SEASONS.winterAllYear]: true
      })
      const result = await chargeVersionService._getTwoPartTariffTransactionTypes({ isSummer: false }, chargeVersion)
      expect(result).to.equal({
        types: [{ type: TRANSACTION_TYPE.twoPartTariff, isSummer: false }],
        chargeVersionHasAgreement: true
      })
    })
  })
  experiment('._getSupplementaryTransactionTypes', () => {
    let chargeVersion
    beforeEach(async => {
      chargeVersion = createChargeVersionRow()
    })
    afterEach(async => {
      sandbox.restore()
    })
    test('when the charge version should not be included in supplementary billing', async () => {
      const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion)
      expect(result).to.equal({ types: [], chargeVersionHasAgreement: false })
    })
    experiment('when the charge version should be included in supplementary billing', () => {
      beforeEach(async => {
        chargeVersion.includeInSupplementaryBilling = true
        chargeVersionServices.getByChargeVersionId.resolves(chargeVersion)
      })
      test('when the charge version does not have a 2pt agreement', async () => {
        chargeVersion.licence.licenceAgreements = []
        chargeVersionServices.getByChargeVersionId.resolves(chargeVersion)
        const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion)
        expect(result).to.equal({
          types: [{
            type: TRANSACTION_TYPE.annual,
            isSummer: false
          }],
          chargeVersionHasAgreement: false
        })
      })
      test('when the charge version does have a 2pt agreement but no previous 2PT batches', async () => {
        const exiistingTPTBatches = [createBatch(Batch.BATCH_TYPE.supplementary)]
        const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion, exiistingTPTBatches)
        expect(result).to.equal({
          types: [
            { type: TRANSACTION_TYPE.annual, isSummer: false }
          ],
          chargeVersionHasAgreement: true
        })
      })
      test('when the charge version does have a 2pt agreement with previous summer 2PT batch', async () => {
        const exiistingTPTBatches = [createBatch(Batch.BATCH_TYPE.twoPartTariff, true)]
        const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion, exiistingTPTBatches)
        expect(result).to.equal({
          types: [
            { type: TRANSACTION_TYPE.annual, isSummer: false },
            { isSummer: true, type: 'two_part_tariff' }],
          chargeVersionHasAgreement: true
        })
      })
      test('when the charge version does have a 2pt agreement with previous winter 2PT batch', async () => {
        const exiistingTPTBatches = [createBatch(Batch.BATCH_TYPE.twoPartTariff, false)]
        const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion, exiistingTPTBatches)
        expect(result).to.equal({
          types: [
            { type: TRANSACTION_TYPE.annual, isSummer: false },
            { isSummer: false, type: 'two_part_tariff' }
          ],
          chargeVersionHasAgreement: true
        })
      })
      test('when the charge version does have a 2pt agreement with previous summer and winter 2PT batches', async () => {
        const exiistingTPTBatches = [
          createBatch(Batch.BATCH_TYPE.twoPartTariff, true),
          createBatch(Batch.BATCH_TYPE.twoPartTariff, false)]
        const result = await chargeVersionService._getSupplementaryTransactionTypes({ isSummer: false }, chargeVersion, exiistingTPTBatches)
        expect(result).to.equal({
          types: [
            { type: TRANSACTION_TYPE.annual, isSummer: false },
            { isSummer: true, type: 'two_part_tariff' },
            { isSummer: false, type: 'two_part_tariff' }],
          chargeVersionHasAgreement: true
        })
      })
    })
  })
})

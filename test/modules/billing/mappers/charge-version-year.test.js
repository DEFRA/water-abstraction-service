'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uuid = require('uuid/v4')

const ChargeVersionYear = require('../../../../src/lib/models/charge-version-year')
const Batch = require('../../../../src/lib/models/batch')
const ChargeVersion = require('../../../../src/lib/models/charge-version')
const FinancialYear = require('../../../../src/lib/models/financial-year')

const chargeVersionYearMapper = require('../../../../src/modules/billing/mappers/charge-version-year')

const chargeVersionYearRow = {
  billingBatchChargeVersionYearId: uuid(),
  billingBatch: {
    billingBatchId: uuid()
  },
  chargeVersion: {
    chargeVersionId: uuid()
  },
  financialYearEnding: 2019,
  transactionType: 'annual',
  isSummer: false
}

experiment('modules/billing/mappers/charge-version-year', () => {
  experiment('.dbToModel', () => {
    let result

    beforeEach(async () => {
      result = chargeVersionYearMapper.dbToModel(chargeVersionYearRow)
    })

    test('returns a ChargeVersionYear instance with correct ID', async () => {
      expect(result instanceof ChargeVersionYear).to.be.true()
      expect(result.id).to.equal(chargeVersionYearRow.billingBatchChargeVersionYearId)
    })

    test('has a batch property which is an Batch instance', async () => {
      const { batch } = result
      expect(batch instanceof Batch).to.be.true()
      expect(batch.id).to.equal(chargeVersionYearRow.billingBatch.billingBatchId)
    })

    test('has a chargeVersion property which is an ChargeVersion instance', async () => {
      const { chargeVersion } = result
      expect(chargeVersion instanceof ChargeVersion).to.be.true()
      expect(chargeVersion.id).to.equal(chargeVersionYearRow.chargeVersion.chargeVersionId)
    })

    test('has a financial year instance', async () => {
      expect(result.financialYear instanceof FinancialYear).to.be.true()
      expect(result.financialYear.yearEnding).to.equal(chargeVersionYearRow.financialYearEnding)
    })

    test('maps the transaction type value', async () => {
      expect(result.transactionType).to.equal(chargeVersionYearRow.transactionType)
    })

    test('maps the is summer value', async () => {
      expect(result.isSummer).to.equal(chargeVersionYearRow.isSummer)
    })
  })
})

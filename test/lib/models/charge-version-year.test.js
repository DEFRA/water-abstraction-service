const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ChargeVersionYear = require('../../../src/lib/models/charge-version-year')
const Batch = require('../../../src/lib/models/batch')
const ChargeVersion = require('../../../src/lib/models/charge-version')
const FinancialYear = require('../../../src/lib/models/financial-year')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'

class TestModel { };

experiment('lib/models/charge-version-year', () => {
  let chargeVersionYear

  beforeEach(async () => {
    chargeVersionYear = new ChargeVersionYear()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      chargeVersionYear.id = TEST_GUID
      expect(chargeVersionYear.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargeVersionYear.id = 'hey'
      }
      expect(func).to.throw()
    })

    experiment('.batch', () => {
      test('can be set to a Batch instance', async () => {
        const batch = new Batch()
        chargeVersionYear.batch = batch
        expect(chargeVersionYear.batch).to.equal(batch)
      })

      test('throws an error if set to a different model type', async () => {
        const func = () => {
          chargeVersionYear.batch = new TestModel()
        }
        expect(func).to.throw()
      })

      test('throws an error if set to null', async () => {
        const func = () => {
          chargeVersionYear.batch = null
        }
        expect(func).to.throw()
      })
    })

    experiment('.chargeVersion', () => {
      test('can be set to a ChargeVersion instance', async () => {
        const chargeVersion = new ChargeVersion()
        chargeVersionYear.chargeVersion = chargeVersion
        expect(chargeVersionYear.chargeVersion).to.equal(chargeVersion)
      })

      test('throws an error if set to a different model type', async () => {
        const func = () => {
          chargeVersionYear.chargeVersion = new TestModel()
        }
        expect(func).to.throw()
      })

      test('throws an error if set to null', async () => {
        const func = () => {
          chargeVersionYear.chargeVersion = null
        }
        expect(func).to.throw()
      })
    })

    experiment('.financialYear', () => {
      test('can be set to a FinancialYear instance', async () => {
        const financialYear = new FinancialYear()
        chargeVersionYear.financialYear = financialYear
        expect(chargeVersionYear.financialYear).to.equal(financialYear)
      })

      test('throws an error if set to a different model type', async () => {
        const func = () => {
          chargeVersionYear.financialYear = new TestModel()
        }
        expect(func).to.throw()
      })

      test('throws an error if set to null', async () => {
        const func = () => {
          chargeVersionYear.financialYear = null
        }
        expect(func).to.throw()
      })
    })

    experiment('.transactionType', () => {
      Object.values(ChargeVersionYear.TRANSACTION_TYPE).forEach(type => {
        test(`can be set to "${type}"`, async () => {
          const transactionType = type
          chargeVersionYear.transactionType = transactionType
          expect(chargeVersionYear.transactionType).to.equal(transactionType)
        })
      })

      test('throws an error if set to an invalid string', async () => {
        const func = () => {
          chargeVersionYear.transactionType = 'not_a_transaction_type'
        }
        expect(func).to.throw()
      })

      test('throws an error if set to null', async () => {
        const func = () => {
          chargeVersionYear.transactionType = null
        }
        expect(func).to.throw()
      })
    })

    experiment('.isSummer', () => {
      test('can be set to true', async () => {
        chargeVersionYear.isSummer = true
        expect(chargeVersionYear.isSummer).to.equal(true)
      })

      test('can be set to false', async () => {
        chargeVersionYear.isSummer = false
        expect(chargeVersionYear.isSummer).to.equal(false)
      })

      test('throws an error if set to null', async () => {
        const func = () => {
          chargeVersionYear.isSummer = null
        }
        expect(func).to.throw()
      })

      test('throws an error if set to any other type', async () => {
        const func = () => {
          chargeVersionYear.isSummer = 'not-a-boolean'
        }
        expect(func).to.throw()
      })
    })
  })
})

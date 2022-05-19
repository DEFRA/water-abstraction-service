'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()

const Transaction = require('../../../src/lib/models/transaction')
const Agreement = require('../../../src/lib/models/agreement')
const DateRange = require('../../../src/lib/models/date-range')
const ChargeElement = require('../../../src/lib/models/charge-element')
const PurposeUse = require('../../../src/lib/models/purpose-use')
const Licence = require('../../../src/lib/models/licence')
const Region = require('../../../src/lib/models/region')
const InvoiceAccount = require('../../../src/lib/models/invoice-account')
const Batch = require('../../../src/lib/models/batch')
const { CHARGE_SEASON } = require('../../../src/lib/models/constants')
const BillingVolume = require('../../../src/lib/models/billing-volume')

class TestModel {};

const getTestDataForHashing = () => {
  const region = new Region().fromHash({ code: 'A' })

  const batch = new Batch().fromHash({
    type: Batch.BATCH_TYPE.twoPartTariff,
    region
  })

  const invoiceAccount = new InvoiceAccount().fromHash({ accountNumber: 'A00000000A' })

  const licence = new Licence()
  licence.region = region
  licence.licenceNumber = 'ABCCBA'

  const chargeElement = new ChargeElement()
  chargeElement.source = 'supported'
  chargeElement.season = CHARGE_SEASON.summer
  chargeElement.loss = 'low'
  chargeElement.authorisedAnnualQuantity = 5
  chargeElement.billableAnnualQuantity = null
  chargeElement.description = 'Test description'

  const purpose = new PurposeUse()
  purpose.name = 'Spray Irrigation - Direct'
  purpose.code = 'Test Code'
  chargeElement.purposeUse = purpose

  const transaction = new Transaction()
  transaction.chargePeriod = new DateRange('2010-01-01', '2020-01-01')
  transaction.billableDays = 1
  transaction.authorisedDays = 2
  transaction.chargeElement = chargeElement
  transaction.volume = 3
  transaction.isCompensationCharge = true
  transaction.isTwoPartSecondPartCharge = true
  transaction.isNewLicence = false
  transaction.isDeMinimis = false

  transaction.calcSourceFactor = 0.5
  transaction.calcSeasonFactor = 0.5

  transaction.calcLossFactor = 0.5
  transaction.calcSucFactor = 0.5
  transaction.calcS126Factor = 'S126 x 0.5'
  transaction.calcS127Factor = 'S127 x 0.5'
  transaction.calcEiucFactor = 0.5
  transaction.calcEiucSourceFactor = 0.5

  transaction.agreements = [
    new Agreement().fromHash({ code: 'S130T' }),
    new Agreement().fromHash({ code: 'S127' }),
    new Agreement().fromHash({ code: 'S130W' })
  ]

  transaction.description = 'description'

  return { batch, invoiceAccount, licence, transaction }
}

experiment('lib/models/transaction', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('construction', () => {
    test('can be passed no initial values', async () => {
      const transaction = new Transaction()
      expect(transaction.id).to.be.undefined()
      expect(transaction.value).to.be.undefined()
      expect(transaction.isCredit).to.be.false()
    })

    test('can be passed an id', async () => {
      const id = uuid()
      const transaction = new Transaction(id)
      expect(transaction.id).to.equal(id)
      expect(transaction.value).to.be.undefined()
      expect(transaction.isCredit).to.be.false()
    })

    test('can be passed a value', async () => {
      const id = uuid()
      const transaction = new Transaction(id, 100)
      expect(transaction.id).to.equal(id)
      expect(transaction.value).to.equal(100)
      expect(transaction.isCredit).to.be.false()
    })

    test('can be setup as a credit', async () => {
      const id = uuid()
      const transaction = new Transaction(id, 100, true)
      expect(transaction.id).to.equal(id)
      expect(transaction.value).to.equal(100)
      expect(transaction.isCredit).to.be.true()
    })
  })

  experiment('.isCredit', () => {
    test('throw an error for a non boolean value', async () => {
      const transaction = new Transaction()
      const func = () => (transaction.isCredit = '$$$')
      expect(func).to.throw()
    })
  })

  experiment('.toJSON', () => {
    test('returns the expected object', async () => {
      const transaction = new Transaction()
      transaction.id = uuid()
      transaction.value = 123
      transaction.isCredit = true

      expect(transaction.toJSON()).to.equal({
        id: transaction.id,
        value: transaction.value,
        isCredit: transaction.isCredit,
        isCreditedBack: false,
        status: 'candidate',
        agreements: []
      })
    })
  })

  experiment('.authorisedDays', () => {
    test('can be set to a number of days in year', async () => {
      const transaction = new Transaction()
      transaction.authorisedDays = 125
      expect(transaction.authorisedDays).to.equal(125)
    })

    test('can be set to zero', async () => {
      const transaction = new Transaction()
      transaction.authorisedDays = 0
      expect(transaction.authorisedDays).to.equal(0)
    })

    test('setting to a value >366 throws an error', async () => {
      const transaction = new Transaction()
      const func = () => {
        transaction.authorisedDays = 367
      }
      expect(func).to.throw()
    })

    test('setting to a value <0 throws an error', async () => {
      const transaction = new Transaction()
      const func = () => {
        transaction.authorisedDays = -1
      }
      expect(func).to.throw()
    })

    test('setting to a non-integer throws an error', async () => {
      const transaction = new Transaction()
      const func = () => {
        transaction.authorisedDays = 55.432
      }
      expect(func).to.throw()
    })
  })

  experiment('.billableDays', () => {
    test('can be set to a number of days in year', async () => {
      const transaction = new Transaction()
      transaction.billableDays = 125
      expect(transaction.billableDays).to.equal(125)
    })

    test('can be set to zero', async () => {
      const transaction = new Transaction()
      transaction.billableDays = 0
      expect(transaction.billableDays).to.equal(0)
    })

    test('setting to a value >366 throws an error', async () => {
      const transaction = new Transaction()
      const func = () => {
        transaction.billableDays = 367
      }
      expect(func).to.throw()
    })

    test('setting to a non-integer throws an error', async () => {
      const transaction = new Transaction()
      const func = () => {
        transaction.billableDays = 55.432
      }
      expect(func).to.throw()
    })
  })

  experiment('.agreements', () => {
    let agreements

    beforeEach(async () => {
      agreements = [
        new Agreement()
      ]
    })

    test('can set to an array of Agreement objects', async () => {
      const transaction = new Transaction()
      transaction.agreements = agreements
      expect(transaction.agreements).to.equal(agreements)
    })

    test('throws an error if the array contains non-Agreements', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.agreements = [
          new Agreement(),
          new TestModel(),
          new Agreement()
        ]
      }

      expect(func).to.throw()
    })
  })

  experiment('.chargePeriod', () => {
    let dateRange

    beforeEach(async () => {
      dateRange = new DateRange('2019-04-01', '2020-03-31')
    })

    test('can be set to a DateRange object', async () => {
      const transaction = new Transaction()
      transaction.chargePeriod = dateRange
      expect(transaction.chargePeriod).to.equal(dateRange)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.chargePeriod = new TestModel()
      }

      expect(func).to.throw()
    })
  })

  experiment('.isCompensationCharge', () => {
    test('can be set to a boolean', async () => {
      const transaction = new Transaction()
      transaction.isCompensationCharge = true
      expect(transaction.isCompensationCharge).to.equal(true)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.isCompensationCharge = 'not-a-boolean'
      }

      expect(func).to.throw()
    })
  })

  experiment('.description', () => {
    const testDescription = 'Charge description'

    test('can be set to a string', async () => {
      const transaction = new Transaction()
      transaction.description = testDescription
      expect(transaction.description).to.equal(testDescription)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.description = 1234
      }

      expect(func).to.throw()
    })
  })

  experiment('.chargeElementPurposeUseCode', () => {
    test('returns the correct charge element purpose code', async () => {
      const testData = getTestDataForHashing()
      expect(testData.transaction.chargeElementPurposeUseCode).to.equal(testData.transaction.chargeElement.purposeUse.code)
    })

    test('throws an error if trying to set to the value', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.chargeElementPurposeUseCode = 'test code'
      }

      expect(func).to.throw()
    })
  })

  experiment('.chargeElement', () => {
    const chargeElement = new ChargeElement()

    test('can be set to a ChargeElement instance', async () => {
      const transaction = new Transaction()
      transaction.chargeElement = chargeElement
      expect(transaction.chargeElement).to.equal(chargeElement)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.chargeElement = new TestModel()
      }

      expect(func).to.throw()
    })
  })

  experiment('.status', () => {
    let transaction
    beforeEach(() => {
      transaction = new Transaction()
    })
    for (const status of ['candidate', 'charge_created', 'approved', 'error']) {
      test(`can set the status to "${status}"`, async () => {
        transaction.status = status
        expect(transaction.status).to.equal(status)
      })
    }

    test('setting status to invalid value throws an error', async () => {
      const func = () => {
        transaction.status = 'invalid-value'
      }
      expect(func).throw()
    })
  })

  experiment('.volume', () => {
    let transaction
    beforeEach(() => {
      transaction = new Transaction()
      transaction.chargeElement = new ChargeElement()
      transaction.chargeElement.authorisedAnnualQuantity = 15
    })
    test('can be set to a positive number', async () => {
      transaction.volume = 4.465
      expect(transaction.volume).to.equal(4.465)
    })

    test('can be set to null', async () => {
      transaction.volume = null
      expect(transaction.volume).to.be.null()
    })

    test('throws an error if set a negative number', async () => {
      const func = () => {
        transaction.volume = -5.34
      }

      expect(func).to.throw()
    })

    test('returns the max annual quantity if the volume is greater than charge element max quantity', async () => {
      transaction.volume = 20
      expect(transaction.volume).to.equal(transaction.chargeElement.authorisedAnnualQuantity)
    })

    test('can be set to a quantity between billable and auth quantity', async () => {
      transaction.chargeElement.billableAnnualQuantity = 12
      transaction.volume = 13
      expect(transaction.volume).to.equal(13)
    })

    test('throws an error if set to any other type', async () => {
      const func = () => {
        transaction.volume = 'a string'
      }

      expect(func).to.throw()
    })
  })

  experiment('.billingVolume', () => {
    let transaction
    beforeEach(() => {
      transaction = new Transaction()
    })

    test('can be set to a BillingVolume instance', async () => {
      const billingVolume = new BillingVolume()
      transaction.billingVolume = billingVolume
      expect(transaction.billingVolume).to.equal(billingVolume)
    })

    test('throws an error if set to any other type', async () => {
      const func = () => {
        transaction.billingVolume = new TestModel()
      }

      expect(func).to.throw()
    })

    test('can be set to null', async () => {
      transaction.billingVolume = null
      expect(transaction.billingVolume).to.be.null()
    })
  })

  experiment('.isNewLicence', () => {
    test('can be set to boolean true', async () => {
      const transaction = new Transaction()
      transaction.isNewLicence = true
      expect(transaction.isNewLicence).to.equal(true)
    })

    test('can be set to boolean false', async () => {
      const transaction = new Transaction()
      transaction.isNewLicence = false
      expect(transaction.isNewLicence).to.equal(false)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.isNewLicence = null
      }

      expect(func).to.throw()
    })
  })

  experiment('.isMinimumCharge', () => {
    test('can be set to boolean true', async () => {
      const transaction = new Transaction()
      transaction.isMinimumCharge = true
      expect(transaction.isMinimumCharge).to.equal(true)
    })

    test('can be set to boolean false', async () => {
      const transaction = new Transaction()
      transaction.isMinimumCharge = false
      expect(transaction.isMinimumCharge).to.equal(false)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.isMinimumCharge = null
      }

      expect(func).to.throw()
    })
  })

  experiment('.externalId', () => {
    test('validates that the external id should be a uuid', async () => {
      const transaction = new Transaction()
      const func = () => (transaction.externalId = 'nope')
      expect(func).to.throw()
    })

    test('can be set to null', async () => {
      const transaction = new Transaction()
      transaction.externalId = null
      expect(transaction.externalId).to.equal(null)
    })

    test('can be set if external id value is valid', async () => {
      const externalId = uuid()
      const transaction = new Transaction()
      transaction.externalId = externalId
      expect(transaction.externalId).to.equal(externalId)
    })
  })

  experiment('.isTwoPartSecondPartCharge', () => {
    test('can be set to boolean', async () => {
      const transaction = new Transaction()
      transaction.isTwoPartSecondPartCharge = true
      expect(transaction.isTwoPartSecondPartCharge).to.equal(true)
    })

    test('throws an error if set to any other type', async () => {
      const transaction = new Transaction()

      const func = () => {
        transaction.isTwoPartSecondPartCharge = null
      }

      expect(func).to.throw()
    })
  })

  experiment('.createDescription', () => {
    let transaction

    beforeEach(async () => {
      transaction = getTestDataForHashing().transaction
    })

    experiment('when the transaction has no two-part tariff agreements', () => {
      beforeEach(async () => {
        transaction.agreements = []
      })

      test('the standard charge description is the charge element description', async () => {
        transaction.isCompensationCharge = false
        const description = transaction.createDescription()
        expect(description).to.equal('Test Description')
        expect(transaction.description).to.equal(description)
      })

      test('the compensation charge text is preset', async () => {
        transaction.isCompensationCharge = true
        const description = transaction.createDescription()
        expect(description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element')
      })

      test('if the charge element has no description, the purpose use is used', async () => {
        transaction.isCompensationCharge = false
        transaction.chargeElement.description = null

        const description = transaction.createDescription()
        expect(description).to.equal(transaction.chargeElement.purposeUse.name)
      })
    })

    experiment('when the transaction has a two-part tariff agreement', () => {
      test('the standard charge description includes the charge element description', async () => {
        transaction.isCompensationCharge = false
        transaction.isTwoPartSecondPartCharge = false
        const description = transaction.createDescription()
        expect(description).to.equal('First Part Spray Irrigation Charge Test Description')
        expect(transaction.description).to.equal(description)
      })

      test('the standard charge description excludes the charge element description if null', async () => {
        transaction.isCompensationCharge = false
        transaction.isTwoPartSecondPartCharge = false
        transaction.chargeElement.description = null

        const description = transaction.createDescription()
        expect(description).to.equal('First Part Spray Irrigation Charge')
      })

      test('the compensation charge text is preset', async () => {
        transaction.isCompensationCharge = true
        transaction.isTwoPartSecondPartCharge = false
        const description = transaction.createDescription()
        expect(description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element')
      })

      test('the two-part tariff supplementary charge text includes the charge element description', async () => {
        transaction.isCompensationCharge = false
        transaction.isTwoPartSecondPartCharge = true
        const description = transaction.createDescription()
        expect(description).to.equal('Second Part Spray Irrigation Charge Test Description')
      })
    })
  })

  experiment('.isErrorStatus', () => {
    const { candidate, chargeCreated, approved, error } = Transaction.statuses

    test('returns true when the status is "error"', async () => {
      const transaction = new Transaction()
      transaction.status = error
      expect(transaction.isErrorStatus).to.be.true()
    });

    [candidate, chargeCreated, approved].forEach(status => {
      test(`returns false when the status is "${status}"`, async () => {
        const transaction = new Transaction()
        transaction.status = status
        expect(transaction.isErrorStatus).to.be.false()
      })
    })
  })
  experiment('.isWaterCompanyCharge', () => {
    test('can set it to boolean value', async () => {
      const transaction = new Transaction()
      transaction.isWaterCompanyCharge = true
      expect(transaction.isWaterCompanyCharge).to.be.true()
    })
    test('throw an error for a non boolean value', async () => {
      const transaction = new Transaction()
      const func = () => (transaction.isWaterCompanyCharge = '$$$')
      expect(func).to.throw()
    })
  })
  experiment('.isCreditedBack', () => {
    test('can set it to boolean value', async () => {
      const transaction = new Transaction()
      transaction.isCreditedBack = true
      expect(transaction.isCreditedBack).to.be.true()
    })
    test('throw an error for a non boolean value', async () => {
      const transaction = new Transaction()
      const func = () => (transaction.isCreditedBack = '$$$')
      expect(func).to.throw()
    })
  })
})

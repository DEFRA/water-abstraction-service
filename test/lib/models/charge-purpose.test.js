'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ChargePurpose = require('../../../src/lib/models/charge-purpose')
const AbstractionPeriod = require('../../../src/lib/models/abstraction-period')
const PurposeUse = require('../../../src/lib/models/purpose-use')
const Purpose = require('../../../src/lib/models/purpose')
const DateRange = require('../../../src/lib/models/date-range')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'

class TestModel {}

experiment('lib/models/charge-purpose', () => {
  let chargePurpose

  beforeEach(async () => {
    chargePurpose = new ChargePurpose()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      chargePurpose.id = TEST_GUID
      expect(chargePurpose.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargePurpose.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.loss', () => {
    ['high', 'medium', 'low', 'very low', 'non-chargeable'].forEach(loss => {
      test(`can be set to ${loss}`, async () => {
        chargePurpose.loss = loss
        expect(chargePurpose.loss).to.equal(loss)
      })
    })

    test('throws an error if set to an invalid loss', async () => {
      const func = () => {
        chargePurpose.loss = 'somewhere between high and low'
      }
      expect(func).to.throw()
    })
  })

  experiment('.abstractionPeriod', () => {
    test('can be set to an AbstractionPeriod instance', async () => {
      const absPeriod = new AbstractionPeriod()
      chargePurpose.abstractionPeriod = absPeriod
      expect(chargePurpose.abstractionPeriod).to.equal(absPeriod)
    })

    test('throws an error if set to another type', async () => {
      const func = () => {
        chargePurpose.abstractionPeriod = new TestModel()
      }
      expect(func).to.throw()
    })
  })

  experiment('.authorisedAnnualQuantity', () => {
    test('can be set to a float', async () => {
      chargePurpose.authorisedAnnualQuantity = 9.3
      expect(chargePurpose.authorisedAnnualQuantity).to.equal(9.3)
    })

    test('a non-numeric value that passes validation is parsed as a float', async () => {
      chargePurpose.authorisedAnnualQuantity = '10.2'
      expect(chargePurpose.authorisedAnnualQuantity).to.be.a.number().equal(10.2)
    })

    test('throws an error if set to a non-numeric value', () => {
      const func = () => { chargePurpose.authorisedAnnualQuantity = 'hello' }
      expect(func).to.throw()
    })
  })

  experiment('.billableAnnualQuantity', () => {
    test('can be set to a float', async () => {
      chargePurpose.billableAnnualQuantity = 9.3
      expect(chargePurpose.billableAnnualQuantity).to.equal(9.3)
    })

    test('a non-numeric value that passes validation is parsed as a float', async () => {
      chargePurpose.billableAnnualQuantity = '10.2'
      expect(chargePurpose.billableAnnualQuantity).to.be.a.number().equal(10.2)
    })

    test('can be set to null', async () => {
      chargePurpose.billableAnnualQuantity = null
      expect(chargePurpose.billableAnnualQuantity).to.be.a.equal(null)
    })

    test('throws an error if set to a non-numeric value', () => {
      const func = () => { chargePurpose.billableAnnualQuantity = 'hello' }
      expect(func).to.throw()
    })
  })

  experiment('.maxAnnualQuantity', () => {
    test('returns billableAnnualQuantity when this is set', async () => {
      chargePurpose.billableAnnualQuantity = 9.3
      expect(chargePurpose.maxAnnualQuantity).to.equal(9.3)
    })

    test('returns authorisedAnnualQuantity when this is set', async () => {
      chargePurpose.authorisedAnnualQuantity = 10.2
      expect(chargePurpose.maxAnnualQuantity).to.equal(10.2)
    })

    test('returns maximum of authorisedAnnualQuantity and billableAnnualQuantity when both are set', async () => {
      chargePurpose.billableAnnualQuantity = 9.3
      chargePurpose.authorisedAnnualQuantity = 10.2
      expect(chargePurpose.maxAnnualQuantity).to.equal(10.2)
    })
  })

  experiment('.volume', () => {
    test('is the billableAnnualQuantity if set', async () => {
      chargePurpose.authorisedAnnualQuantity = 10.7
      chargePurpose.billableAnnualQuantity = 9.3
      expect(chargePurpose.volume).to.equal(9.3)
    })

    test('is the authorisedQuantity if billableAnnualQuantity is null', async () => {
      chargePurpose.authorisedAnnualQuantity = 10.7
      chargePurpose.billableAnnualQuantity = null
      expect(chargePurpose.volume).to.equal(10.7)
    })
  })

  experiment('.purposeUse', () => {
    test('can be set to a PurposeUse instance', async () => {
      const purpose = new PurposeUse()
      chargePurpose.purposeUse = purpose
      expect(chargePurpose.purposeUse).to.equal(purpose)
    })

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod()
      const func = () => { chargePurpose.purposeUse = period }
      expect(func).to.throw()
    })
  })

  experiment('.timeLimitedPeriod', () => {
    test('can be set to a DateRange instance', async () => {
      const timeLimitedPeriod = new DateRange()
      chargePurpose.timeLimitedPeriod = timeLimitedPeriod
      expect(chargePurpose.timeLimitedPeriod).to.equal(timeLimitedPeriod)
    })

    test('can be set to null', async () => {
      chargePurpose.timeLimitedPeriod = null
      expect(chargePurpose.timeLimitedPeriod).to.be.null()
    })

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod()
      const func = () => { chargePurpose.timeLimitedPeriod = period }
      expect(func).to.throw()
    })
  })

  experiment('.toJSON', () => {
    test('result is an object', async () => {
      const result = chargePurpose.toJSON()
      expect(result).to.be.an.object()
    })

    test('the maxAnnualQuantity property is included', async () => {
      chargePurpose.billableAnnualQuantity = 1
      chargePurpose.authorisedAnnualQuantity = 2
      const result = chargePurpose.toJSON()
      expect(result.maxAnnualQuantity).to.equal(2)
    })
  })

  experiment('description', () => {
    test('can be set to null', async () => {
      chargePurpose.description = null
      expect(chargePurpose.description).to.equal(null)
    })

    test('can be set to a string value', async () => {
      chargePurpose.description = 'test'
      expect(chargePurpose.description).to.equal('test')
    })

    test('throws an error if set to a number', async () => {
      const func = () => { chargePurpose.description = 123 }
      expect(func).to.throw()
    })
  })

  experiment('.chargeElementId', () => {
    test('can be set to a guid string', async () => {
      chargePurpose.chargeElementId = TEST_GUID
      expect(chargePurpose.chargeElementId).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        chargePurpose.chargeElementId = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.purposePrimary', () => {
    test('can be set to a Purpose instance', async () => {
      const purpose = new Purpose()
      chargePurpose.purposePrimary = purpose
      expect(chargePurpose.purposePrimary).to.equal(purpose)
    })

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod()
      const func = () => { chargePurpose.purposePrimary = period }
      expect(func).to.throw()
    })
  })

  experiment('.purposeSecondary', () => {
    test('can be set to a Purpose instance', async () => {
      const purpose = new Purpose()
      chargePurpose.purposeSecondary = purpose
      expect(chargePurpose.purposeSecondary).to.equal(purpose)
    })

    test('throws an error if setting to an instance of another model', async () => {
      const period = new AbstractionPeriod()
      const func = () => { chargePurpose.purposeSecondary = period }
      expect(func).to.throw()
    })
  })

  experiment('.isFactorsOverridden', () => {
    test('can be set to a boolean true', async () => {
      chargePurpose.isFactorsOverridden = true
      expect(chargePurpose.isFactorsOverridden).to.equal(true)
    })

    test('can be set to a boolean false', async () => {
      chargePurpose.isFactorsOverridden = false
      expect(chargePurpose.isFactorsOverridden).to.equal(false)
    })

    test('throws an error if set to a non-boolean', async () => {
      const func = () => {
        chargePurpose.isFactorsOverridden = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.isSection127AgreementEnabled', () => {
    test('defaults to true for a new model', async () => {
      expect(chargePurpose.isSection127AgreementEnabled).to.be.true()
    })

    test('can be set to true', async () => {
      chargePurpose.isSection127AgreementEnable = true
      expect(chargePurpose.isSection127AgreementEnabled).to.be.true()
    })

    test('can be set to false', async () => {
      chargePurpose.isSection127AgreementEnabled = false
      expect(chargePurpose.isSection127AgreementEnabled).to.be.false()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        chargePurpose.isSection127AgreementEnabled = null
      }
      expect(func).to.throw()
    })
  })
})

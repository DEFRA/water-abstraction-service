'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const ReturnRequirement = require('../../../src/lib/models/return-requirement')
const ReturnRequirementPurpose = require('../../../src/lib/models/return-requirement-purpose')
const PurposeUse = require('../../../src/lib/models/purpose-use')

class TestModel { };

experiment('lib/models/return-requirement', () => {
  let returnRequirement

  beforeEach(async () => {
    returnRequirement = new ReturnRequirement()
  })

  experiment('.id', () => {
    test('can be set to a GUID', async () => {
      const id = uuid()
      returnRequirement.id = id
      expect(returnRequirement.id).to.equal(id)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirement.id = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a non-guid', async () => {
      const func = () => {
        returnRequirement.id = 'not-a-guid'
      }
      expect(func).to.throw()
    })
  })

  experiment('.isSummer', () => {
    test('can be set to a boolean true', async () => {
      returnRequirement.isSummer = true
      expect(returnRequirement.isSummer).to.equal(true)
    })

    test('can be set to a boolean false', async () => {
      returnRequirement.isSummer = true
      expect(returnRequirement.isSummer).to.equal(true)
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        returnRequirement.isSummer = null
      }
      expect(func).to.throw()
    })

    test('throws an error if set to another non-boolean value', async () => {
      const func = () => {
        returnRequirement.isSummer = 'spring'
      }
      expect(func).to.throw()
    })
  })

  experiment('.returnRequirementPurposes', () => {
    test('can be set to an array of ReturnRequirementPurpose models', async () => {
      const returnRequirementPurposes = [new ReturnRequirementPurpose()]
      returnRequirement.returnRequirementPurposes = returnRequirementPurposes
      expect(returnRequirement.returnRequirementPurposes).to.equal(returnRequirementPurposes)
    })

    test('throws an error if not an array', async () => {
      const func = () => {
        const notAnArray = new ReturnRequirementPurpose()
        returnRequirement.returnRequirementPurposes = notAnArray
      }
      expect(func).to.throw()
    })

    test('throws an error if set to a different model type', async () => {
      const func = () => {
        const notPurposeUses = [new TestModel()]
        returnRequirement.returnRequirementPurposes = notPurposeUses
      }
      expect(func).to.throw()
    })
  })

  experiment('.isTwoPartTariffPurposeUse', () => {
    const createReturnRequirementPurpose = isTwoPartTariff => {
      const returnRequirementPurpose = new ReturnRequirementPurpose()
      returnRequirementPurpose.purposeUse = new PurposeUse()
      returnRequirementPurpose.purposeUse.fromHash({
        isTwoPartTariff
      })
      return returnRequirementPurpose
    }

    test('is true when all the return requirement purposes are two part tariff', () => {
      returnRequirement.returnRequirementPurposes = [
        createReturnRequirementPurpose(true),
        createReturnRequirementPurpose(true),
        createReturnRequirementPurpose(true)
      ]
      expect(returnRequirement.isTwoPartTariffPurposeUse).to.be.true()
    })

    test('is true when some of the return requirement purposes are two part tariff', () => {
      returnRequirement.returnRequirementPurposes = [
        createReturnRequirementPurpose(false),
        createReturnRequirementPurpose(true),
        createReturnRequirementPurpose(false)
      ]
      expect(returnRequirement.isTwoPartTariffPurposeUse).to.be.true()
    })

    test('is false when none of the return requirement purposes are two part tariff', () => {
      returnRequirement.returnRequirementPurposes = [
        createReturnRequirementPurpose(false),
        createReturnRequirementPurpose(false),
        createReturnRequirementPurpose(false)
      ]
      expect(returnRequirement.isTwoPartTariffPurposeUse).to.be.false()
    })
  })

  experiment('.legacyId', () => {
    test('can be set to a number', async () => {
      returnRequirement.legacyId = 1234
      expect(returnRequirement.legacyId).to.equal(1234)
    })

    test('can be set to null', async () => {
      returnRequirement.legacyId = null
      expect(returnRequirement.legacyId).to.equal(null)
    })

    test('throws an error if set to a non-numeric/null value', async () => {
      const func = () => {
        returnRequirement.legacyId = 'not-a-number'
      }
      expect(func).to.throw()
    })
  })
})

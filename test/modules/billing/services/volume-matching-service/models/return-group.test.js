'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uuid = require('uuid/v4')
const moment = require('moment')

const ReturnGroup = require('../../../../../../src/modules/billing/services/volume-matching-service/models/return-group')
const PurposeUse = require('../../../../../../src/lib/models/purpose-use')
const Return = require('../../../../../../src/lib/models/return')
const DateRange = require('../../../../../../src/lib/models/date-range')
const ReturnRequirement = require('../../../../../../src/lib/models/return-requirement')
const ReturnRequirementPurpose = require('../../../../../../src/lib/models/return-requirement-purpose')

const { twoPartTariffStatuses } = require('../../../../../../src/lib/models/billing-volume')

const createPurposeUse = (name, options = {}) => {
  const purposeUse = new PurposeUse()
  return purposeUse.fromHash({
    id: uuid(),
    isTwoPartTariff: options.isTwoPartTariffPurpose || false,
    name
  })
}

const createReturnRequirementPurpose = (name, options) => {
  return new ReturnRequirementPurpose()
    .fromHash({
      purposeUse: createPurposeUse(name, options)
    })
}

const createReturnRequirement = (name, options) => {
  const returnRequirement = new ReturnRequirement()
  return returnRequirement.fromHash({
    returnRequirementPurposes: [
      createReturnRequirementPurpose(name, options)
    ]
  })
}

const createReturn = (name, options) => {
  const ret = new Return()
  return ret.fromHash({
    returnRequirement: createReturnRequirement(name, options),
    dateRange: new DateRange('2019-04-01', '2020-03-01'),
    dueDate: '2020-04-28',
    status: 'completed',
    receivedDate: '2020-04-15'
  })
}

experiment('modules/billing/services/volume-matching-service/models/return-group', () => {
  let returnGroup

  beforeEach(async () => {
    returnGroup = new ReturnGroup([
      createReturn('sprayIrrigation', { isTwoPartTariffPurpose: true }),
      createReturn('vegetableWashing', { isTwoPartTariffPurpose: false })
    ])
  })

  experiment('.constructor', () => {
    test('sets .returns property to an array of returns if provided', async () => {
      expect(returnGroup.returns).to.be.an.array().length(2)
      expect(returnGroup.returns[0] instanceof Return).to.be.true()
      expect(returnGroup.returns[1] instanceof Return).to.be.true()
    })

    test('intialises .returns property to an empty array if returns not provided', async () => {
      returnGroup = new ReturnGroup()
      expect(returnGroup.returns).to.be.an.array().length(0)
    })
  })

  experiment('.createForTwoPartTariff', () => {
    test('creates a new ReturnGroup containing only returns without a two-part tariff purpose', async () => {
      const tptGroup = returnGroup.createForTwoPartTariff()
      expect(tptGroup.returns).to.be.an.array().length(1)
      expect(returnGroup.returns[0].purposeUses[0].isTwoPartTariff).to.be.true()
    })
  })

  experiment('.errorCode', () => {
    test('returns correct error when there are no returns for matching', async () => {
      returnGroup.returns = []
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING)
    })

    test('returns correct error when all returns are due', async () => {
      returnGroup.returns[0].status = Return.RETURN_STATUS.due
      returnGroup.returns[1].status = Return.RETURN_STATUS.due
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED)
    })

    test('returns correct error when some returns are due', async () => {
      returnGroup.returns[0].status = Return.RETURN_STATUS.due
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE)
    })

    test('returns correct error when some returns received late', async () => {
      returnGroup.returns[0].receivedDate = '2020-06-01'
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_LATE_RETURNS)
    })

    test('returns correct error when some returns are under query', async () => {
      returnGroup.returns[0].isUnderQuery = true
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_UNDER_QUERY)
    })

    test('returns correct error when some returns are received not keyed', async () => {
      returnGroup.returns[0].status = Return.RETURN_STATUS.received
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_RECEIVED)
    })

    test('returns correct error when some returns are not yet due for billing', async () => {
      returnGroup.returns[0].dueDate = moment().format('YYYY-MM-DD')
      expect(returnGroup.errorCode).to.equal(twoPartTariffStatuses.ERROR_NOT_DUE_FOR_BILLING)
    })
  })
})

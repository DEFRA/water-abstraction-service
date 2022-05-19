'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()

const returnsConnector = require('../../../src/lib/connectors/returns')
const returnCyclesService = require('../../../src/lib/services/return-cycles')

const DateRange = require('../../../src/lib/models/date-range')
const ReturnCycle = require('../../../src/lib/models/return-cycle')
const User = require('../../../src/lib/models/user')

const data = {
  cycles: [{
    returnCycleId: uuid(),
    startDate: '2019-04-01',
    endDate: '2020-03-31',
    dueDate: '2020-04-28',
    isSummer: true
  }],
  returns: [{
    returnId: 'test-return-id',
    startDate: '2019-04-01',
    endDate: '2020-03-31',
    userId: 'bob@example.com'
  }, {
    returnId: 'test-return-id',
    startDate: '2019-04-01',
    endDate: '2020-03-31',
    userId: null
  }]
}

experiment('src/lib/services/return-cycles', () => {
  beforeEach(async () => {
    sandbox.stub(returnsConnector, 'getReturnsCyclesReport')
    sandbox.stub(returnsConnector, 'getReturnCycleById')
    sandbox.stub(returnsConnector, 'getReturnCycleReturns')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReturnCycleReport', () => {
    let result

    beforeEach(async () => {
      returnsConnector.getReturnsCyclesReport.resolves({
        data: data.cycles
      })
      result = await returnCyclesService.getReturnCycleReport()
    })

    test('calls the connector method getting cycles starting on 2017-11-01 onwards', async () => {
      expect(returnsConnector.getReturnsCyclesReport.calledWith(
        '2017-11-01'
      )).to.be.true()
    })

    test('returns a cycles array', async () => {
      expect(result).to.be.an.array().length(1)
    })

    test('maps dates to a DateRange instance', async () => {
      const { cycles: [cycle] } = data
      expect(result[0].dateRange instanceof DateRange).to.be.true()
      expect(result[0].dateRange.startDate).to.equal(cycle.startDate)
      expect(result[0].dateRange.endDate).to.equal(cycle.endDate)
    })

    test('maps "returnCycleId" property to "id"', async () => {
      const { cycles: [cycle] } = data
      expect(result[0].id).to.equal(cycle.returnCycleId)
    })

    test('maps other properties unchanged', async () => {
      const { cycles: [cycle] } = data
      expect(result[0].dueDate).to.equal(cycle.dueDate)
    })
  })

  experiment('.getReturnCycleById', () => {
    let result
    const returnCycleId = 'test-id'

    experiment('when a record is found', () => {
      beforeEach(async () => {
        returnsConnector.getReturnCycleById.resolves(
          data.cycles[0]
        )
        result = await returnCyclesService.getReturnCycleById(returnCycleId)
      })

      test('makes the expected api call', async () => {
        expect(returnsConnector.getReturnCycleById.calledWith(
          returnCycleId
        )).to.be.true()
      })

      test('returns a ReturnCycle model', async () => {
        expect(result instanceof ReturnCycle).to.be.true()
      })

      test('has the expected data', async () => {
        const [cycle] = data.cycles
        expect(result.id).to.equal(cycle.returnCycleId)
        expect(result.dateRange.startDate).to.equal(cycle.startDate)
        expect(result.dateRange.endDate).to.equal(cycle.endDate)
        expect(result.isSummer).to.be.true()
      })
    })

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        returnsConnector.getReturnCycleById.resolves(null)
        result = await returnCyclesService.getReturnCycleById(returnCycleId)
      })

      test('returns null', async () => {
        expect(result).to.be.null()
      })
    })
  })

  experiment('.getReturnCycleReturns', () => {
    let result
    const returnCycleId = 'test-id'

    beforeEach(async () => {
      returnsConnector.getReturnCycleReturns.resolves(
        { data: data.returns }
      )
      result = await returnCyclesService.getReturnCycleReturns(returnCycleId)
    })

    test('makes the expected api call', async () => {
      expect(returnsConnector.getReturnCycleReturns.calledWith(
        returnCycleId
      )).to.be.true()
    })

    test('returns an array of data expected data', async () => {
      expect(result).to.be.an.array().length(2)
    })

    test('maps the first return - submitted', async () => {
      const { returns: [ret] } = data

      // ID
      expect(result[0].id).to.equal(ret.returnId)

      // Date range
      expect(result[0].dateRange instanceof DateRange).to.be.true()
      expect(result[0].dateRange.startDate).to.equal(ret.startDate)
      expect(result[0].dateRange.endDate).to.equal(ret.endDate)

      // User
      expect(result[0].user instanceof User).to.be.true()
      expect(result[0].user.email).to.equal(ret.userId)
    })

    test('maps the second return - submitted', async () => {
      // User
      expect(result[1].user).to.be.null()
    })
  })
})

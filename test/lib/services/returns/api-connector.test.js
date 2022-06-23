const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { expect } = require('@hapi/code')
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const returnsApiConnector = require('../../../../src/lib/connectors/returns')
const apiConnector = require('../../../../src/lib/services/returns/api-connector')

experiment('lib/services/returns/api-connector', () => {
  beforeEach(async () => {
    sandbox.stub(returnsApiConnector.returns, 'findAll').resolves([{
      version_id: 'test-version-id'
    }])
    sandbox.stub(returnsApiConnector.versions, 'findAll').resolves([{
      version_id: 'test-version-id'
    }])
    sandbox.stub(returnsApiConnector.lines, 'findAll').resolves([{
      line_id: 'test-line-id'
    }])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReturnsForLicenceInCycle', () => {
    let result, cycle

    experiment('when the cycle is summer', () => {
      beforeEach(async () => {
        cycle = {
          startDate: '2019-11-01',
          endDate: '2020-10-31',
          isSummer: true
        }
        result = await apiConnector.getReturnsForLicenceInCycle('01/123', cycle)
      })

      test('the correct filter is used', async () => {
        const [filter] = returnsApiConnector.returns.findAll.lastCall.args
        expect(filter).to.equal({
          licence_ref: '01/123',
          status: { $ne: 'void' },
          start_date: { $gte: '2019-11-01' },
          end_date: { $lte: '2020-10-31' },
          'metadata->>isSummer': 'true'
        })
      })

      test('the results are sorted by end date then return ID', async () => {
        const [, sort] = returnsApiConnector.returns.findAll.lastCall.args
        expect(sort).to.equal({
          end_date: +1,
          return_id: +1
        })
      })

      test('resolves with an array', async () => {
        expect(result).to.be.an.array().length(1)
      })
    })
  })

  experiment('.getCurrentVersion', () => {
    let result

    beforeEach(async () => {
      result = await apiConnector.getCurrentVersion('test-return-id')
    })

    test('calls the API connector with the correct filter and sort params', async () => {
      const [filter, sort] = returnsApiConnector.versions.findAll.lastCall.args
      expect(filter).to.equal({
        return_id: 'test-return-id',
        current: true
      })
      expect(sort).to.equal({
        version_number: -1
      })
    })

    test('resolves with the first record found', async () => {
      expect(result.version_id).to.equal('test-version-id')
    })
  })

  experiment('.getLines', () => {
    let result

    beforeEach(async () => {
      result = await apiConnector.getLines('test-version-id')
    })

    test('calls the API connector with the correct filter and sort params', async () => {
      const [filter, sort] = returnsApiConnector.lines.findAll.lastCall.args
      expect(filter).to.equal({
        version_id: 'test-version-id'
      })
      expect(sort).to.equal({
        start_date: +1
      })
    })

    test('resolves with all records found', async () => {
      expect(result).to.be.an.array().length(1)
      expect(result[0].line_id).to.equal('test-line-id')
    })
  })

  experiment('.getLicenceReturnsByStatusAndEndDate', () => {
    beforeEach(async () => {
      await apiConnector.getLicenceReturnsByStatusAndEndDate(
        '01/123/ABC',
        ['due', 'received'],
        '2018-04-01',
        '2019-03-31'
      )
    })

    test('the returns api is called with the correct filter', async () => {
      const [filter] = returnsApiConnector.returns.findAll.lastCall.args
      expect(filter).to.equal({
        licence_ref: '01/123/ABC',
        status: {
          $in: ['due', 'received']
        },
        end_date: { $gte: '2018-04-01', $lte: '2019-03-31' }
      })
    })

    test('sorts by end date then return ID', async () => {
      const [, sort] = returnsApiConnector.returns.findAll.lastCall.args
      expect(sort).to.equal({
        end_date: +1,
        return_id: +1
      })
    })
  })
})

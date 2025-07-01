const sinon = require('sinon')
const Lab = require('@hapi/lab')
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

const searchReturns = require('../../../../src/modules/internal-search/lib/search-returns')
const returnsService = require('../../../../src/lib/connectors/returns')

// Test returns data
const returns = [{
  return_id: 'a',
  licence_ref: 'x',
  metadata: {
    nald: {
      regionCode: 2
    }
  }
}, {
  return_id: 'b',
  licence_ref: 'y',
  metadata: {
    nald: {
      regionCode: 1
    }
  }
}, {
  return_id: 'c',
  licence_ref: 'z',
  metadata: {
    nald: {
      regionCode: 1
    }
  }
}]

const errorResponse = {
  data: null,
  error: 'Some error'
}
const singleResponse = {
  data: [returns[0]],
  error: null
}

experiment('mapReturn', () => {
  test('It should map a row of data from the returns API to include the region name', async () => {
    const mapped = searchReturns.mapReturn(returns[0])
    expect(mapped.region).to.equal('Midlands')
  })
})

experiment('findReturnByReturnId', () => {
  let stub

  afterEach(async () => {
    stub.restore()
  })

  test('It should throw an error if API response contains error', async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(errorResponse)
    expect(searchReturns.findReturnByReturnId('v1:123')).to.reject()
  })

  test('It should call API with correct arguments', async () => {
    const { return_id: returnId } = returns[0]
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse)
    await searchReturns.findReturnByReturnId(returnId)
    expect(stub.firstCall.args[0]).to.equal({
      regime: 'water',
      licence_type: 'abstraction',
      return_id: returnId
    })
  })

  test('It should resolve with data from API if call successful', async () => {
    const { return_id: returnId } = returns[0]
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse)
    const response = await searchReturns.findReturnByReturnId(returnId)
    expect(response).to.equal(singleResponse.data)
  })
})

experiment('mapRecentReturns', () => {
  test('It should select the first return in each NALD region', async () => {
    const result = searchReturns.mapRecentReturns(returns)
    const ids = result.map(row => row.return_id)
    expect(ids).to.only.include(['a', 'b'])
  })
})

experiment('findRecentReturnsByFormatId', () => {
  let stub
  const formatId = '12345'

  beforeEach(async () => {
    stub = sinon.stub(returnsService.returns, 'findAll').resolves(returns)
  })

  afterEach(async () => {
    stub.restore()
  })

  test('It should query the returns API with correct filter, columns and sorting options', async () => {
    await searchReturns.findRecentReturnsByFormatId(formatId)

    const [filter, sort, columns] = returnsService.returns.findAll.firstCall.args

    expect(filter.regime).to.equal('water')
    expect(filter.licence_type).to.equal('abstraction')
    expect(filter.return_requirement).to.equal(formatId)
    expect(sort).to.equal({ end_date: -1 })
    expect(columns).to.include([
      'return_id', 'licence_ref', 'return_requirement',
      'end_date', 'metadata', 'status'
    ])
  })
})

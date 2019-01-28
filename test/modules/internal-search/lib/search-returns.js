const sinon = require('sinon');
const Lab = require('lab');
const { experiment, test, afterEach, beforeEach } = exports.lab = Lab.script();
const { expect } = require('code');

const searchReturns = require('../../../../src/modules/internal-search/lib/search-returns');
const documents = require('../../../../src/lib/connectors/crm/documents');
const returnsService = require('../../../../src/lib/connectors/returns');

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
}];

const errorResponse = {
  data: null,
  error: 'Some error'
};
const singleResponse = {
  data: [returns[0]],
  error: null
};

experiment('mapReturn', () => {
  test('It should map a row of data from the returns API to include the region name', async () => {
    const mapped = searchReturns.mapReturn(returns[0]);
    expect(mapped.region).to.equal('Midlands');
  });
});

experiment('filterReturnsByCRMDocument', () => {
  let stub;

  afterEach(async () => {
    stub.restore();
  });

  test('It should throw an error if API response contains error', async () => {
    stub = sinon.stub(documents, 'findMany').resolves(errorResponse);
    expect(searchReturns.filterReturnsByCRMDocument(returns)).to.reject();
  });

  test('It should filter returns for which a CRM document cannot be found', async () => {
    stub = sinon.stub(documents, 'findMany').resolves({ data: [{
      system_external_id: 'y'
    }]});
    const result = await searchReturns.filterReturnsByCRMDocument(returns);
    expect(result).to.equal([returns[1]]);
  });
});

experiment('findReturnByReturnId', () => {
  let stub;

  afterEach(async () => {
    stub.restore();
  });

  test('It should throw an error if API response contains error', async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(errorResponse);
    expect(searchReturns.findReturnByReturnId('v1:123')).to.reject();
  });

  test('It should call API with correct arguments', async () => {
    const { return_id: returnId } = returns[0];
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse);
    await searchReturns.findReturnByReturnId(returnId);
    expect(stub.firstCall.args[0]).to.equal({
      regime: 'water',
      licence_type: 'abstraction',
      return_id: returnId
    });
  });

  test('It should resolve with data from API if call successful', async () => {
    const { return_id: returnId } = returns[0];
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse);
    const response = await searchReturns.findReturnByReturnId(returnId);
    expect(response).to.equal(singleResponse.data);
  });
});

experiment('findLatestReturnByFormatId', () => {
  let stub;
  const formatId = '12345';
  const regionCode = '2';

  afterEach(async () => {
    stub.restore();
  });

  test('It should throw an error if API response contains error', async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(errorResponse);
    expect(searchReturns.findLatestReturnByFormatId(12345, 2)).to.reject();
  });

  test('It should call API with correct arguments', async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse);
    await searchReturns.findLatestReturnByFormatId(formatId, regionCode);
    const [ filter, sort, pagination, columns ] = stub.firstCall.args;

    expect(filter).to.equal({
      regime: 'water',
      licence_type: 'abstraction',
      return_requirement: formatId,
      'metadata->nald->regionCode': parseInt(regionCode)
    });

    expect(sort).to.equal({
      end_date: -1
    });

    expect(pagination).to.equal({
      page: 1,
      perPage: 1
    });

    expect(columns).to.equal([
      'return_id', 'status', 'licence_ref', 'return_requirement', 'metadata',
      'due_date', 'end_date'
    ]);
  });

  test('It should resolve with data from API if call successful', async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse);
    const result = await searchReturns.findLatestReturnByFormatId(formatId, regionCode);
    expect(result).to.equal(singleResponse.data[0]);
  });
});

experiment('findRecentReturnsByFormatId', async () => {
  let stub;
  const formatId = '12345';

  beforeEach(async () => {
    stub = sinon.stub(returnsService.returns, 'findMany').resolves(singleResponse);
  });

  afterEach(async () => {
    stub.restore();
  });

  test('It should search for the most recent return in each NALD region 1-8', async () => {
    const result = await searchReturns.findRecentReturnsByFormatId(formatId);
    expect(result.length).to.equal(8);

    const callArgs = stub.getCalls().map(call => call.args);
    const regionCodes = callArgs.map(call => call[0]['metadata->nald->regionCode']);
    expect(regionCodes).to.equal([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

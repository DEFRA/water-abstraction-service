const Lab = require('lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { returns: returnsConnector } = require('../../../../src/lib/connectors/returns');
const { range } = require('lodash');

const {
  voidInvalidCycles,
  getFilter,
  processReturnsAsync
} = require('../../../../src/modules/import/lib/void-invalid-cycles');

experiment('getFilter', () => {
  const licenceRef = '01/234/567';
  const returnIds = ['v1:123/456', 'v2:789/123'];

  test('returns a filter object when there are valid return IDs', async () => {
    const filter = getFilter(licenceRef, returnIds);
    expect(filter).to.equal({ regime: 'water',
      licence_type: 'abstraction',
      licence_ref: '01/234/567',
      source: 'NALD',
      return_id: { '$nin': [ 'v1:123/456', 'v2:789/123' ] } });
  });

  test('returns a filter object when there are no valid return IDs', async () => {
    const filter = getFilter(licenceRef, []);
    expect(filter).to.equal({ regime: 'water',
      licence_type: 'abstraction',
      licence_ref: '01/234/567',
      source: 'NALD' });
  });
});

experiment('processReturnsAsync', () => {
  const returns = [{
    return_id: 123
  }, {
    return_id: 456
  }];

  const func = async (returnId) => {
    return returnId + 1;
  };

  test('returns a filter object when there are valid return IDs', async () => {
    const result = await processReturnsAsync(returns, func);
    expect(result).to.equal([ 124, 457 ]);
  });
});

experiment('voidInvalidCycles', () => {
  beforeEach(async () => {
    sandbox.stub(returnsConnector, 'findAll').resolves([
      { return_id: 1 },
      { return_id: 2 },
      { return_id: 3 }
    ]);

    sandbox.stub(returnsConnector, 'updateOne').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('updates all the returns', async () => {
    const licenceNumber = '123';
    const returnIds = [1, 2, 3];

    await voidInvalidCycles(licenceNumber, returnIds);

    expect(returnsConnector.findAll.callCount).to.equal(1);
    expect(returnsConnector.updateOne.callCount).to.equal(3);
    expect(returnsConnector.updateOne.calledWith(1, { status: 'void' })).to.be.true();
    expect(returnsConnector.updateOne.calledWith(2, { status: 'void' })).to.be.true();
    expect(returnsConnector.updateOne.calledWith(3, { status: 'void' })).to.be.true();
  });

  /**
   * This is because the call to returns.findAll ends up creating a GET
   * request but the request can become too large with too many return ids.
   */
  test('chunks up the calls when more than 20', async () => {
    const licenceNumber = '123';
    // create an array with 60 items (1 to 60)
    const returnIds = range(1, 61);

    // on first call to findAll returns with ids 1 to 20 are returned
    returnsConnector.findAll
      .onFirstCall()
      .resolves(range(1, 21).map(id => ({ return_id: id })));

    // on second call to findAll returns with ids 21 to 40 are returned
    returnsConnector.findAll
      .onSecondCall()
      .resolves(range(21, 41).map(id => ({ return_id: id })));

    // on third call to findAll returns with ids 41 to 60 are returned
    returnsConnector.findAll
      .onThirdCall()
      .resolves(range(41, 61).map(id => ({ return_id: id })));

    await voidInvalidCycles(licenceNumber, returnIds);

    expect(returnsConnector.findAll.callCount).to.equal(3);
    expect(returnsConnector.updateOne.callCount).to.equal(60);

    returnIds.forEach(i => {
      expect(returnsConnector.updateOne.calledWith(i, { status: 'void' })).to.be.true();
    });
  });
});

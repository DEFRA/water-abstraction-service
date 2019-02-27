const moment = require('moment');
const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const returns = require('../../../src/lib/connectors/returns');

experiment('getActiveReturns', () => {
  beforeEach(async () => {
    sandbox.stub(returns.returns, 'findAll').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('calls the returns API with correct arguments', async () => {
    const returnIds = ['a', 'b'];

    await returns.getActiveReturns(returnIds);

    const [filter, sort, columns] = returns.returns.findAll.firstCall.args;

    const today = moment().format('YYYY-MM-DD');

    expect(filter).to.equal({
      return_id: { $in: returnIds },
      end_date: { $gte: '2018-10-31', $lte: today },
      status: { $ne: 'void' },
      'metadata->>isCurrent': 'true'
    });

    expect(sort).to.equal(null);

    expect(columns).to.equal(['return_id', 'status']);
  });
});

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

    expect(columns).to.include(['return_id', 'status', 'due_date']);
  });
});

experiment('getCurrentDueReturns', () => {
  beforeEach(async () => {
    sandbox.stub(returns.returns, 'findAll').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('calls the returns API with the correct arguments when no licences are excluded', async () => {
    await returns.getCurrentDueReturns([], '2019-03-31');

    const [filter] = returns.returns.findAll.lastCall.args;
    expect(filter).to.equal({
      end_date: '2019-03-31',
      status: 'due',
      regime: 'water',
      licence_type: 'abstraction',
      'metadata->>isCurrent': 'true'
    });
  });

  test('calls the returns API with the correct arguments when licences are excluded', async () => {
    await returns.getCurrentDueReturns(['01/123', '04/567'], '2019-03-31');

    const [filter] = returns.returns.findAll.lastCall.args;
    expect(filter).to.equal({
      end_date: '2019-03-31',
      status: 'due',
      regime: 'water',
      licence_type: 'abstraction',
      'metadata->>isCurrent': 'true',
      licence_ref: {
        $nin: ['01/123', '04/567']
      }
    });
  });
});

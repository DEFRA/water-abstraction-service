const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const moment = require('moment');
const sandbox = sinon.createSandbox();
const { returns } = require('../../../../src/lib/connectors/returns');
const apiConnector = require('../../../../src/modules/returns/lib/api-connector');

experiment('patchReturnData', () => {
  beforeEach(async () => {
    sandbox.stub(returns, 'updateOne').resolves({
      data: {},
      error: null
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('updates the return with the expected data', async () => {
    returns.updateOne.resolves({ data: {}, error: null });
    const status = 'due';
    const isUnderQuery = true;
    const receivedDate = moment().toISOString();
    const ret = { returnId: 'ret-id', status, receivedDate, isUnderQuery };

    await apiConnector.patchReturnData(ret);

    expect(returns.updateOne.args[0][0]).to.equal('ret-id');
    expect(returns.updateOne.args[0][1]).to.equal({
      status,
      received_date: receivedDate,
      under_query: true
    });
  });
});

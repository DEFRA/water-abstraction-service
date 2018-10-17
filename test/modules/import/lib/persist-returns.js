const Lab = require('lab');
const sinon = require('sinon');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');

const returnsApi = require('../../../../src/lib/connectors/returns');
const persistReturns = require('../../../../src/modules/import/lib/persist-returns');

const naldReturn = {
  return_id: 'v1:123:456',
  regime: 'water',
  licence_type: 'abstraction',
  licence_ref: '01/234/567',
  start_date: '2016-11-01',
  end_date: '2017-10-31',
  returns_frequency: 'month',
  status: 'completed',
  source: 'NALD',
  metadata: { param: 'value' },
  received_date: '2017-11-24',
  return_requirement: '012345',
  due_date: '2017-11-28'
};

const digitalServiceReturn = {
  return_id: 'v1:234:789',
  regime: 'water',
  licence_type: 'abstraction',
  licence_ref: '04/567/890',
  start_date: '2017-11-01',
  end_date: '2018-10-31',
  returns_frequency: 'month',
  status: 'due',
  source: 'NALD',
  metadata: { param: 'value' },
  received_date: '2018-11-24',
  return_requirement: '67890',
  due_date: '2018-11-28'
};

experiment('returnExists', () => {
  test('It should return true if return exists', async () => {
    const stub = sinon.stub(returnsApi.returns, 'findOne').resolves({ error: null, data: digitalServiceReturn });
    const exists = await persistReturns.returnExists('01/123');
    expect(exists).to.equal(true);
    stub.restore();
  });

  test('It should return false if return does not exist', async () => {
    const stub = sinon.stub(returnsApi.returns, 'findOne').resolves({ error: { name: 'NotFoundError' }, data: null });
    const exists = await persistReturns.returnExists('01/123');
    expect(exists).to.equal(false);
    stub.restore();
  });
});

experiment('getUpdateRow', () => {
  test('It should update metadata, status and date received for a past return', async () => {
    const data = persistReturns.getUpdateRow(naldReturn);
    expect(data).to.equal({ status: 'completed',
      metadata: { param: 'value' },
      received_date: '2017-11-24' });
  });

  test('It should update metadata only for a return managed by the digital service', async () => {
    const data = persistReturns.getUpdateRow(digitalServiceReturn);
    expect(data).to.equal({ metadata: { param: 'value' } });
  });
});

experiment('createOrUpdateReturn', () => {
  let stubs;

  beforeEach(async () => {
    stubs = {
      findOne: sinon.stub(returnsApi.returns, 'findOne'),
      create: sinon.stub(returnsApi.returns, 'create'),
      updateOne: sinon.stub(returnsApi.returns, 'updateOne')
    };
  });

  afterEach(async () => {
    stubs.findOne.restore();
    stubs.create.restore();
    stubs.updateOne.restore();
  });

  test('It should create a row if the record is not present', async () => {
    stubs.findOne.resolves({ error: { name: 'NotFoundError' }, data: null });
    stubs.create.resolves({error: null});
    await persistReturns.createOrUpdateReturn(naldReturn);

    expect(stubs.create.firstCall.args[0]).to.equal(naldReturn);
    expect(stubs.updateOne.firstCall).to.equal(null);
  });

  test('It should update a NALD return if the record is present', async () => {
    stubs.findOne.resolves({ error: null, data: naldReturn });
    stubs.updateOne.resolves({error: null});
    await persistReturns.createOrUpdateReturn(naldReturn);

    expect(stubs.create.firstCall).to.equal(null);
    expect(stubs.updateOne.firstCall.args).to.equal([naldReturn.return_id, {
      metadata: naldReturn.metadata,
      status: naldReturn.status,
      received_date: naldReturn.received_date
    }]);
  });

  test('It should update a digital service return metadata only if the record is present', async () => {
    stubs.findOne.resolves({ error: null, data: digitalServiceReturn });
    stubs.updateOne.resolves({error: null});
    await persistReturns.createOrUpdateReturn(digitalServiceReturn);

    expect(stubs.create.firstCall).to.equal(null);
    expect(stubs.updateOne.firstCall.args).to.equal([digitalServiceReturn.return_id, {
      metadata: digitalServiceReturn.metadata
    }]);
  });
});

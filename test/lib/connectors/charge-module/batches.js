'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const batches = require('../../../../src/lib/connectors/charge-module/batches');
const request = require('../../../../src/lib/connectors/charge-module/request');

experiment('lib/connectors/charge-module/batches', () => {
  beforeEach(async () => {
    sandbox.stub(request, 'patch').resolves();
    sandbox.stub(request, 'post').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.approve', () => {
    let batchId;

    beforeEach(async () => {
      batchId = uuid();
      await batches.approve('S', batchId);
    });

    test('sends a patch request using the expected path', async () => {
      const [path] = request.patch.lastCall.args;
      expect(path).to.equal('v1/wrls/transaction_queue/approve');
    });

    test('sends a patch request with the expected payload', async () => {
      const [, payload] = request.patch.lastCall.args;
      expect(payload).to.equal({
        region: 'S',
        filter: {
          batchNumber: batchId
        }
      });
    });
  });

  experiment('.delete', () => {
    let batchId;

    beforeEach(async () => {
      batchId = uuid();
      await batches.delete('S', batchId);
    });

    test('sends a post request using the expected path', async () => {
      const [path] = request.post.lastCall.args;
      expect(path).to.equal('v1/wrls/transaction_queue/remove');
    });

    test('sends a post request with the expected payload', async () => {
      const [, payload] = request.post.lastCall.args;
      expect(payload).to.equal({
        region: 'S',
        filter: {
          batchNumber: batchId
        }
      });
    });
  });

  experiment('.send', () => {
    test('sends a post request using the expected path', async () => {
      await batches.send('S', uuid());
      const [path] = request.post.lastCall.args;
      expect(path).to.equal('v1/wrls/billruns');
    });

    test('sends a post request with the expected payload', async () => {
      const batchId = uuid();
      await batches.send('S', batchId);

      const [, payload] = request.post.lastCall.args;

      expect(payload).to.equal({
        region: 'S',
        draft: true,
        filter: {
          batchNumber: batchId
        }
      });
    });

    test('isDraft can be set to true to send the bill run', async () => {
      const batchId = uuid();
      await batches.send('S', batchId, false);

      const [, payload] = request.post.lastCall.args;

      expect(payload).to.equal({
        region: 'S',
        draft: false,
        filter: {
          batchNumber: batchId
        }
      });
    });
  });
});

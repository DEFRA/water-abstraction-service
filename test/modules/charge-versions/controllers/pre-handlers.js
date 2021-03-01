'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const chargeVersionWorkflowService = require('../../../../src/modules/charge-versions/services/charge-version-workflows');
const preHandlers = require('../../../../src/modules/charge-versions/controllers/pre-handlers');
const ChargeVersionWorkflow = require('../../../../src/lib/models/charge-version-workflow');
const licenceVersions = require('../../../../src/lib/connectors/repos/licence-versions');

experiment('modules/charge-versions/controllers/pre-handlers', () => {
  let chargeVersionWorkflow;

  beforeEach(async () => {
    chargeVersionWorkflow = new ChargeVersionWorkflow();
    chargeVersionWorkflow.fromHash({
      id: '7bfdb410-8fe2-41df-bb3a-e85984112f3b',
      status: 'review'
    });

    sandbox.stub(chargeVersionWorkflowService, 'getById').resolves(chargeVersionWorkflow);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.loadChargeVersionWorkflow', () => {
    let request;

    beforeEach(async () => {
      request = {
        params: {
          chargeVersionWorkflowId: 'test-charge-version-workflow-id'
        }
      };
    });

    experiment('when the charge version workflow is not found', () => {
      test('a not found error is returned', async () => {
        chargeVersionWorkflowService.getById.resolves(null);

        const result = await preHandlers.loadChargeVersionWorkflow(request);
        const { statusCode, message } = result.output.payload;

        expect(statusCode).to.equal(404);
        expect(message).to.equal('No charge version workflow found with id: test-charge-version-workflow-id');
      });
    });

    experiment('when the charge version workflow is found', () => {
      let result;
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersionWorkflow(request);
      });

      test('calls the charge version workflow service with the id', async () => {
        const [id] = chargeVersionWorkflowService.getById.lastCall.args;
        expect(id).to.equal(request.params.chargeVersionWorkflowId);
      });

      test('it is returned from the function', async () => {
        expect(result).to.equal(chargeVersionWorkflow);
      });
    });
  });

  experiment('.loadLicenceVersion', () => {
    let result;
    let request;
    const rows = [
      { licenceVersionId: 'test-lv-id1', issue: 100, increment: 0, status: 'superseded', startDate: '2019-06-01', endDate: '2020-05-31' },
      { licenceVersionId: 'test-lv-id2', issue: 101, increment: 1, status: 'current', startDate: '2020-06-01', endDate: null },
      { licenceVersionId: 'test-lv-id3', issue: 101, increment: 2, status: 'draft', startDate: '2021-06-01', endDate: null }
    ];
    beforeEach(async () => {
      request = {
        payload: {
          licenceId: 'test-licence-id',
          chargeVersion: {
            dateRange: { startDate: '2020-06-28' }
          }
        }
      };
      sandbox.stub(licenceVersions, 'findByLicenceId').resolves(rows);
    });

    experiment('when data is found', () => {
      beforeEach(async () => {
        result = await preHandlers.loadLicenceVersion(request);
      });

      test('the licence id is used to get the licence versions', async () => {
        const [licenceId] = licenceVersions.findByLicenceId.lastCall.args;
        expect(licenceId).to.equal(request.payload.licenceId);
      });

      test('the correct licence version is returned', async () => {
        expect(result).to.equal(rows[1]);
      });
    });

    experiment('when the data is not found', () => {
      beforeEach(async () => {
        const err = new Error();
        err.statusCode = 404;
        licenceVersions.findByLicenceId.rejects(err);
        result = await preHandlers.loadLicenceVersion(request);
      });

      test('resolves with a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
        expect(result.message).to.equal('Licence version not found for licence test-licence-id');
      });
    });
  });
});

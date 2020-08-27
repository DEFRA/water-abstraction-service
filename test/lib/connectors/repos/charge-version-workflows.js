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

const ChargeVersionWorkflow = require('../../../../src/lib/connectors/bookshelf/ChargeVersionWorkflow.js');
const chargeVersionWorkflowsRepo = require('../../../../src/lib/connectors/repos/charge-version-workflows');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/charge-version-workflows', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne');
    sandbox.stub(helpers, 'findMany');
    sandbox.stub(helpers, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.findOne('test-id');
    });

    test('delegates to the findOne helper', async () => {
      const [model, idKey, idValue, relatedModels] = helpers.findOne.lastCall.args;
      expect(model).to.equal(ChargeVersionWorkflow);
      expect(idKey).to.equal('chargeVersionWorkflowId');
      expect(idValue).to.equal('test-id');
      expect(relatedModels).to.equal([
        'licence'
      ]);
    });
  });

  experiment('.findAll', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.findAll();
    });

    test('delegates to the findMany helper', async () => {
      const [model, conditions, relatedModels] = helpers.findMany.lastCall.args;
      expect(model).to.equal(ChargeVersionWorkflow);
      expect(conditions).to.equal({});
      expect(relatedModels).to.equal([
        'licence'
      ]);
    });
  });

  experiment('.create', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.create({
        foo: 'bar'
      });
    });

    test('delegates to the create helper', async () => {
      const [model, data] = helpers.create.lastCall.args;
      expect(model).to.equal(ChargeVersionWorkflow);
      expect(data).to.equal({ foo: 'bar' });
    });
  });
});

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

const applicationState = require('../../../../src/lib/connectors/repos/application-state');
const { ApplicationState } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/application-state', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ applicationStateId: 'test-id' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      save: sandbox.stub().resolves(model)
    };
    sandbox.stub(ApplicationState, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    beforeEach(async () => {
      await applicationState.create({ data: { foo: 'bar' } });
    });

    test('calls .forge() to create a model', async () => {
      expect(ApplicationState.forge.calledWith({ data: { foo: 'bar' } }))
        .to.be.true();
    });

    test('calls .save() on the model', async () => {
      expect(stub.save.called).to.be.true();
    });
  });

  experiment('.update', () => {
    beforeEach(async () => {
      await applicationState.update('test-id', { data: { foo: 'bar' } });
    });

    test('calls model.forge.where with id', async () => {
      expect(ApplicationState.forge.calledWith({
        applicationStateId: 'test-id'
      })).to.be.true();
    });

    test('calls .save() with the updates', async () => {
      const [updates] = stub.save.lastCall.args;
      expect(updates).to.equal({ data: { foo: 'bar' } });
    });
  });

  experiment('.findOneByKey', () => {
    let result;

    experiment('when a record is found', () => {
      beforeEach(async () => {
        result = await applicationState.findOneByKey('test-key');
      });

      test('calls model.forge with correct key', async () => {
        const [params] = ApplicationState.forge.lastCall.args;
        expect(params).to.equal({ key: 'test-key' });
      });

      test('calls fetch()', async () => {
        expect(stub.fetch.called).to.be.true();
      });

      test('calls toJSON() on returned models', async () => {
        expect(model.toJSON.callCount).to.equal(1);
      });

      test('returns the result of the toJSON() call', async () => {
        expect(result).to.equal({ applicationStateId: 'test-id' });
      });
    });

    experiment('when a record is not found', () => {
      beforeEach(async () => {
        stub.fetch.resolves(null);
        result = await applicationState.findOneByKey('test-id');
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});

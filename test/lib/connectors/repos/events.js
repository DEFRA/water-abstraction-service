const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const events = require('../../../../src/lib/connectors/repos/events');
const { Event } = require('../../../../src/lib/connectors/bookshelf/');

experiment('lib/connectors/repos/events', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      save: sandbox.stub().resolves(model)
    };

    sandbox.stub(Event, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    let result;

    beforeEach(async () => {
      result = await events.findOne('test-id');
    });

    test('calls model.forge with correct id', async () => {
      const [params] = Event.forge.lastCall.args;
      expect(params).to.equal({ eventId: 'test-id' });
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.create', () => {
    let result;

    beforeEach(async () => {
      result = await events.create(model);
    });

    test('returns a JSON object of the model created', async () => {
      expect(result).to.equal(model.toJSON());
    });
  });

  experiment('.update', () => {
    let result;

    beforeEach(async () => {
      result = await events.update('test-id', model);
    });

    test('calls model.forge.where with id', async () => {
      const { args } = stub.where.lastCall;
      expect(args[0].eventId).to.equal('test-id');
    });

    test('returns a JSON object of the model updated', async () => {
      expect(result).to.equal(model.toJSON());
    });
  });

  experiment('.updateStatus', () => {
    let result;

    beforeEach(async () => {
      result = await events.updateStatus('test-id', 'test-status');
    });

    test('calls model.forge.where with id', async () => {
      const { args } = stub.where.lastCall;
      expect(args[0].eventId).to.equal('test-id');
    });

    test('calls model.forge.where.save with correct parameters', async () => {
      const { args } = stub.save.lastCall;
      expect(args[0].status).to.equal('test-status');
      expect(args[1].patch).to.be.true();
    });

    test('returns a JSON object of the model updated', async () => {
      expect(result).to.equal(model.toJSON());
    });
  });
});

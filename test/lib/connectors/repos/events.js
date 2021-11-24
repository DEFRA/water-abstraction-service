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
const { bookshelf } = require('../../../../src/lib/connectors/bookshelf');
const queries = require('../../../../src/lib/connectors/repos/queries/events');

experiment('lib/connectors/repos/events', () => {
  let model, stub;

  beforeEach(async () => {
    model = {
      eventId: 'test-id',
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      fetch: sandbox.stub().resolves(model),
      save: sandbox.stub().resolves(model)
    };

    sandbox.stub(Event, 'forge').returns(stub);
    sandbox.stub(bookshelf.knex, 'raw');
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
      result = await events.update('test-id', { status: 'updated' });
    });

    test('calls model.forge.where with id', async () => {
      expect(Event.forge.calledWith({
        eventId: 'test-id'
      })).to.be.true();
    });

    test('calls .save() with the updates', async () => {
      const [updates] = stub.save.lastCall.args;
      expect(updates).to.equal({ status: 'updated' });
    });

    test('returns a JSON object of the model updated', async () => {
      expect(result).to.equal(model.toJSON());
    });
  });

  experiment('.findNotifications', () => {
    const params = { limit: 10, offset: 10, filter: 'water_abstraction_alert_stop', sentBy: 'test@user.eu' };

    beforeEach(async () => {
      await events.findNotifications(params);
    });

    test('calls knew.raw with the query and params', async () => {
      expect(bookshelf.knex.raw.calledWith(
        queries.findNotifications, params
      )).to.be.true();
    });
  });

  experiment('.findNotificationsCount', () => {
    beforeEach(async () => {
      await events.findNotificationsCount();
    });

    test('calls knew.raw with the query and params', async () => {
      expect(bookshelf.knex.raw.calledWith(
        queries.findNotificationsCount
      )).to.be.true();
    });
  });
});

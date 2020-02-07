const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Joi = require('@hapi/joi');
const { expect } = require('@hapi/code');
const repo = require('../../src/lib/connectors/repos');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const Event = require('../../src/lib/models/event');

const event = require('../../src/lib/event');

const isDateString = str => {
  const { error } = Joi.validate(str, Joi.date().iso());
  return error === null;
};

const obj = { foo: 'bar' };
const arr = ['foo', 'bar'];

experiment('lib/event', () => {
  beforeEach(async () => {
    sandbox.stub(repo.events, 'update').resolves(obj);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    test('it should create an event with default params', async () => {
      const ev = event.create();
      const { created } = ev;
      expect(isDateString(created)).to.equal(true);
    });

    test('it should enable properties to be set on creation', async () => {
      const ev = event.create({
        type: 'foo',
        subtype: 'bar'
      });
      expect(ev.type).to.equal('foo');
      expect(ev.subtype).to.equal('bar');
    });
  });

  experiment('.save', () => {
    const expectedKeys = [
      'licences',
      'comment',
      'entities',
      'issuer',
      'metadata',
      'modified',
      'reference_code',
      'status',
      'subtype',
      'type',
      'created'
    ];

    const testEvent = new Event();
    testEvent.reference_code = 'abc';
    testEvent.type = 'batch';
    testEvent.subtype = 'test-subtype';
    testEvent.issuer = 'test@user.eu';
    testEvent.licences = [];
    testEvent.entities = [];
    testEvent.comment = 'test';
    testEvent.metadata = '{ batch: 123 }';
    testEvent.status = 'completed';
    testEvent.created = null;
    testEvent.modified = null;

    experiment('it should create a new event', async () => {
      let ev;

      beforeEach(async () => {
        ev = event.create();
        sandbox.stub(repo.events, 'create').resolves(testEvent);
      });

      test('it should call repo.create() once', async () => {
        await event.save(ev);

        expect(repo.events.create.callCount).to.equal(1);
      });

      test('it should contain the correct keys', async () => {
        await event.save(ev);

        const [data] = repo.events.create.firstCall.args;

        expect(Object.keys(data)).to.equal(expectedKeys);
      });

      test('modified date should be null', async () => {
        await event.save(ev);

        const [data] = repo.events.create.firstCall.args;

        expect(data.modified).to.equal(null);
      });
    });

    experiment('it should save an existing event', async () => {
      let ev;

      beforeEach(async () => {
        ev = event.create();
        ev.eventId = 'f6378a83-015b-4afd-8de1-d7eb2ce8e032';
      });

      test('it should call repo.update() once', async () => {
        await event.save(ev);
        expect(repo.events.update.callCount).to.equal(1);
      });

      test('it should pass the correct filter to repo.update', async () => {
        await event.save(ev);
        const [filter] = repo.events.update.firstCall.args;
        expect(filter).to.equal({
          event_id: ev.eventId
        });
      });

      test('it should pass data with the correct keys to repo.update', async () => {
        expectedKeys.push('event_id'); // add the event_id because this is now update and not create so the event-id exists.
        await event.save(ev);
        const [, data] = repo.events.update.firstCall.args;
        expect(Object.keys(data)).to.equal(expectedKeys);
      });

      test('it should set a modified date when updating', async () => {
        await event.save(ev);
        const [, { modified }] = repo.events.update.firstCall.args;
        expect(isDateString(modified)).to.equal(true);
      });
    });

    experiment('it should map JSON fields to strings', async () => {
      beforeEach( async () => {
        sandbox.stub(repo.events, 'create').resolves(obj);
      });
      test('it should stringify objects in jsonb fields', async () => {
        const ev = event.create({
          licences: obj
        });
        await event.save(ev);
        const [data] = repo.events.create.firstCall.args;
        expect(data.licences).to.equal(JSON.stringify(obj));
      });

      test('it should stringify arrays in jsonb fields', async () => {
        const ev = event.create({
          entities: arr
        });
        await event.save(ev);
        const [data] = repo.events.create.firstCall.args;
        expect(data.entities).to.equal(JSON.stringify(arr));
      });

      test('it should leave null unchanged in jsonb fields', async () => {
        const ev = event.create({
          metadata: null
        });
        await event.save(ev);
        const [data] = repo.events.create.firstCall.args;

        expect(data.metadata).to.equal(null);
      });
    });
  });

  experiment('.load', () => {
    beforeEach(async () => {
      sandbox.stub(repo.events, 'findOne').resolves({

        event_id: 'test-id',
        licences: arr,
        metadata: obj,
        entities: null
      });
    });

    test('it should load an event by id', async () => {
      await event.load('event_id');
      const [filter] = repo.events.findOne.firstCall.args;
      expect(filter).to.equal('event_id');
    });

    test('it should parse an object in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.licences).to.equal(arr);
    });

    test('it should parse an array in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.metadata).to.equal(obj);
    });

    test('it should pass through a null unchanged in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.entities).to.equal(null);
    });

    test('it should return null if event not found', async () => {
      repo.events.findOne.resolves([]);
      const ev = await event.load('event_id');
      expect(ev).to.equal(null);
    });
  });

  experiment('.updateStatus', () => {
    let result;

    beforeEach(async () => {
      sandbox.stub(repo.events, 'updateStatus').resolves({
        event_id: 'test-id',
        status: 'new-status'
      });

      result = await event.updateStatus('test-id', 'new-status');
    });

    test('passes the correct filter', async () => {
      const [filter] = repo.events.updateStatus.lastCall.args;
      expect(filter).to.equal('test-id');
    });

    test('passes the correct update data', async () => {
      const [, data] = repo.events.updateStatus.lastCall.args;
      expect(data).to.equal('new-status');
    });

    test('returns the event', async () => {
      expect(result.eventId).to.equal('test-id');
      expect(result.status).to.equal('new-status');
    });
  });
});

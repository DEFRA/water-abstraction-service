const sinon = require('sinon');
const Joi = require('@hapi/joi');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const repo = require('../../src/lib/connectors/repos');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const Event = require('../../src/lib/models/event');
const Licence = require('../../src/lib/models/licence');

const isDateString = str => {
  const { error } = Joi.validate(str, Joi.date().iso());
  return error === null;
};

const event = require('../../src/lib/event');

const arr = ['foo', 'bar'];

experiment('lib/event', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  const licence = new Licence();
  licence.licenceNumber = '122434';

  const testEvent = new Event();
  testEvent.referenceCode = 'abc';
  testEvent.type = 'batch';
  testEvent.subtype = 'test-subtype';
  testEvent.issuer = 'test@user.eu';
  testEvent.licences = [licence];
  testEvent.entities = arr;
  testEvent.comment = 'test';
  testEvent.metadata = null;
  testEvent.status = 'completed';
  testEvent.created = null;
  testEvent.modified = null;
  testEvent.eventId = 'test-id';

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
      'referenceCode',
      'type',
      'subtype',
      'issuer',
      'entities',
      'comment',
      'metadata',
      'status',
      'created',
      'modified',
      'eventId',
      'event_id'
    ];

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
        const { rows } = await event.save(ev);
        expect(Object.keys(rows[0])).to.equal(expectedKeys);
      });

      test('modified date should be null', async () => {
        await event.save(ev);

        const [data] = repo.events.create.firstCall.args;

        expect(data.modified).to.equal(null);
      });
    });

    experiment('it should save an existing event', async () => {
      beforeEach(async () => {
        testEvent.event_id = 'test-id';
        sandbox.stub(repo.events, 'update').resolves(testEvent);
      });

      test('it should call repo.update() once', async () => {
        await event.save(testEvent);
        expect(repo.events.update.callCount).to.equal(1);
      });

      test('it should pass the correct filter to repo.update', async () => {
        await event.save(testEvent);
        const [filter] = repo.events.update.firstCall.args;
        expect(filter).to.equal({
          eventId: testEvent.eventId
        });
      });

      test('it should pass data with the correct keys to repo.update', async () => {
        const keys = [
          'licences',
          'referenceCode',
          'type',
          'subtype',
          'issuer',
          'entities',
          'comment',
          'metadata',
          'status',
          'created',
          'modified',
          'eventId',
          'updatedAt',
          'event_id'
        ];
        const { rows } = await event.save(testEvent);
        expect(Object.keys(rows[0])).to.equal(keys);
      });
    });

    experiment('it should map JSON fields to strings', async () => {
      beforeEach(async () => {
        sandbox.stub(repo.events, 'update').resolves(testEvent);
      });

      test('it should stringify objects in jsonb fields', async () => {
        await event.save(testEvent);
        const [, data] = repo.events.update.firstCall.args;
        expect(data.licences).to.equal(JSON.stringify(testEvent.licences));
      });

      test('it should stringify arrays in jsonb fields', async () => {
        await event.save(testEvent);
        const [, data] = repo.events.update.firstCall.args;
        expect(data.entities).to.equal(JSON.stringify(arr));
      });

      test('it should leave null unchanged in jsonb fields', async () => {
        await event.save(testEvent);
        const [, data] = repo.events.update.firstCall.args;
        expect(data.metadata).to.equal(null);
      });
    });
  });

  experiment('.load', () => {
    beforeEach(async () => {
      testEvent.event_id = testEvent.eventId;
      sandbox.stub(repo.events, 'findOne').resolves(testEvent);
    });

    test('it should load an event by id', async () => {
      await event.load('event_id');
      const [filter] = repo.events.findOne.firstCall.args;
      expect(filter).to.equal('event_id');
    });

    test('it should parse an object in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.licences).to.equal(testEvent.licences);
    });

    test('it should parse an array in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.entities).to.equal(testEvent.entities);
    });

    test('it should pass through a null unchanged in a jsonb field', async () => {
      const ev = await event.load('event_id');
      expect(ev.metadata).to.equal(null);
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
        eventId: 'test-id',
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
      expect(result.event_id).to.equal('test-id');
      expect(result.status).to.equal('new-status');
    });
  });
});

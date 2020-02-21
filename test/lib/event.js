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

  const data = {
    referenceCode: 'abc',
    type: 'batch',
    subtype: 'test-subtype',
    issuer: 'test@user.eu',
    licences: [licence],
    entities: arr,
    comment: 'test',
    metadata: null,
    status: 'completed',
    created: null,
    modified: null
  };
  const eventPOJO = event.create(data);

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
      'event_id'
    ];

    experiment('it should create a new event', async () => {
      let ev;

      beforeEach(async () => {
        ev = event.create(data);
        sandbox.stub(repo.events, 'create').resolves(eventPOJO);
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
        eventPOJO.event_id = 'test-id';
        const ev = event.create(data);
        ev.eventId = 'test-id';
        sandbox.stub(repo.events, 'update').resolves(ev);
      });

      test('it should call repo.update() once', async () => {
        await event.save(eventPOJO);
        expect(repo.events.update.callCount).to.equal(1);
      });

      test('it should pass the correct filter to repo.update', async () => {
        await event.save(eventPOJO);
        const [filter] = repo.events.update.firstCall.args;
        expect(filter).to.equal({ eventId: 'test-id' });
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
          'event_id'
        ];
        const { rows } = await event.save(eventPOJO);
        expect(Object.keys(rows[0])).to.equal(keys);
      });
    });

    experiment('it should map JSON fields to strings', async () => {
      beforeEach(async () => {
        sandbox.stub(repo.events, 'update').resolves(eventPOJO);
      });

      test('it should leave null unchanged in jsonb fields', async () => {
        await event.save(eventPOJO);
        const [, data] = repo.events.update.firstCall.args;
        expect(data.metadata).to.equal(null);
      });
    });
  });

  experiment('.load', () => {
    beforeEach(async () => {
      eventPOJO.eventId = 'event-id';
      sandbox.stub(repo.events, 'findOne').resolves(eventPOJO);
    });

    test('it should load an event by id', async () => {
      await event.load('event-id');
      const [filter] = repo.events.findOne.firstCall.args;
      expect(filter).to.equal('event-id');
    });

    test('it should parse an object in a jsonb field', async () => {
      const ev = await event.load('event-id');
      expect(ev.licences).to.equal(eventPOJO.licences);
    });

    test('it should parse an array in a jsonb field', async () => {
      const ev = await event.load('event-id');
      expect(ev.entities).to.equal(eventPOJO.entities);
    });

    test('it should pass through a null unchanged in a jsonb field', async () => {
      const ev = await event.load('event-id');
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

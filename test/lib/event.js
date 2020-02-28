const sinon = require('sinon');
const Joi = require('@hapi/joi');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const newEvtRepo = require('../../src/lib/services/events');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const Event = require('../../src/lib/models/event');
const moment = require('moment');

const isDateString = str => {
  const { error } = Joi.validate(str, Joi.date().iso());
  return error === null;
};

const event = require('../../src/lib/event');
const arr = ['foo', 'bar'];
const eventModel = new Event();
eventModel.referenceCode = 'abc';
eventModel.type = 'batch';
eventModel.subtype = 'test-subtype';
eventModel.issuer = 'test@example.com';
eventModel.licences = ['122434'];
eventModel.entities = arr;
eventModel.comment = 'test';
eventModel.status = 'completed';
eventModel.created = null;
eventModel.modified = null;

const eventObject = {
  referenceCode: 'abc',
  type: 'batch',
  subtype: 'test-subtype',
  issuer: 'test@example.com',
  licences: ['122434'],
  entities: arr,
  comment: 'test',
  metadata: {},
  status: 'completed',
  created: moment().format('YYYY-MM-DD HH:mm:ss'),
  modified: null
};

const eventPOJO = {
  ...eventObject,
  toJSON: sandbox.stub().returns(eventObject)
};

experiment('lib/event', () => {
  beforeEach(async () => {
    sandbox.stub(Event.prototype, 'fromHash').returns(eventObject);
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    test('it should create an event with default params', async () => {
      const ev = eventObject;
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
      'referenceCode',
      'type',
      'subtype',
      'issuer',
      'licences',
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
        ev = eventObject;
        sandbox.stub(newEvtRepo, 'create').resolves(eventPOJO);
      });

      test('it should call repo.create() once', async () => {
        await event.save(ev);

        expect(newEvtRepo.create.callCount).to.equal(1);
      });

      test('it should contain the correct keys', async () => {
        const { rows } = await event.save(ev);
        expect(Object.keys(rows[0])).to.equal(expectedKeys);
      });
    });

    experiment('it should save an existing event', async () => {
      beforeEach(async () => {
        eventPOJO.event_id = 'test-id';
        sandbox.stub(newEvtRepo, 'update').resolves({ ...eventPOJO, eventId: 'test-id' });
      });

      test('it should call repo.update() once', async () => {
        await event.save(eventPOJO);
        expect(newEvtRepo.update.callCount).to.equal(1);
      });

      test('it should pass the result of eventModel.fromHash to repo.update', async () => {
        await event.save(eventPOJO);
        const [param] = newEvtRepo.update.firstCall.args;
        expect(param).to.equal(eventObject);
      });

      test('it should pass data with the correct keys to repo.update', async () => {
        const keys = [
          'referenceCode',
          'type',
          'subtype',
          'issuer',
          'licences',
          'entities',
          'comment',
          'metadata',
          'status',
          'created',
          'modified',
          'event_id'
        ];
        const { rows } = await event.save(eventPOJO);
        expect(Object.keys(rows[0])).to.equal(keys);
      });
    });

    experiment('it should map JSON fields to strings', async () => {
      beforeEach(async () => {
        sandbox.stub(newEvtRepo, 'update').resolves(eventPOJO);
      });

      test('it should leave empty object in jsonb fields', async () => {
        await event.save(eventObject);
        const [data] = newEvtRepo.update.firstCall.args;
        expect(data.metadata).to.equal({});
      });
    });
  });

  experiment('.load', () => {
    beforeEach(async () => {
      eventPOJO.eventId = 'event-id';
      sandbox.stub(newEvtRepo, 'findOne').resolves(eventPOJO);
    });

    test('it should load an event by id', async () => {
      await event.load('event-id');
      const [filter] = newEvtRepo.findOne.firstCall.args;
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

    test('it should pass through an empty object in a jsonb field', async () => {
      const ev = await event.load('event-id');
      expect(ev.metadata).to.equal({});
    });

    test('it should return null if event not found', async () => {
      newEvtRepo.findOne.resolves([]);
      const ev = await event.load('event_id');
      expect(ev).to.equal(null);
    });
  });

  experiment('.updateStatus', () => {
    let result, pojoStub;

    beforeEach(async () => {
      pojoStub = {
        toJSON: sandbox.stub().resolves({ ...eventPOJO, status: 'new-status' })
      };
      sandbox.stub(newEvtRepo, 'updateStatus').resolves(pojoStub);

      result = await event.updateStatus('test-id', 'new-status');
    });

    test('passes the correct filter', async () => {
      const [filter] = newEvtRepo.updateStatus.lastCall.args;
      expect(filter).to.equal('test-id');
    });

    test('passes the correct update data', async () => {
      const [, data] = newEvtRepo.updateStatus.lastCall.args;
      expect(data).to.equal('new-status');
    });

    test('returns the event', async () => {
      expect(result.event_id).to.equal('test-id');
      expect(result.status).to.equal('new-status');
    });
  });
});

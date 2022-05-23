const sinon = require('sinon');
const Joi = require('joi');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const eventsService = require('../../src/lib/services/events');
const uuid = require('uuid/v4');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const Event = require('../../src/lib/models/event');
const moment = require('moment');

const isDateString = str => Joi.date().iso().validate(str).error === undefined;

const event = require('../../src/lib/event');
const arr = ['foo', 'bar'];

const eventId = uuid();

const createPojo = () => ({
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
});

const createModel = () => {
  const event = new Event(eventId);
  event.fromHash(createPojo());
  return event;
};

experiment('lib/event', () => {
  let result;

  beforeEach(async () => {
    const model = createModel();
    sandbox.stub(eventsService, 'create').resolves(model);
    sandbox.stub(eventsService, 'update').resolves(model);
    sandbox.stub(eventsService, 'findOne').resolves(model);
    sandbox.stub(eventsService, 'updateStatus').resolves(
      createModel().fromHash({ status: 'new-status' })
    );
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    test('it should create an event with default params', async () => {
      const ev = event.create();
      expect(ev.referenceCode).to.be.null();
      expect(ev.type).to.be.null();
      expect(ev.subtype).to.be.null();
      expect(ev.issuer).to.be.null();
      expect(ev.licences).to.equal([]);
      expect(ev.entities).to.equal([]);
      expect(ev.comment).to.be.null();
      expect(ev.metadata).to.equal({});
      expect(ev.status).to.be.null();
      expect(isDateString(ev.created)).to.equal(true);
      expect(ev.modified).to.be.null();
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
      'event_id',
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
      'modified'
    ];

    experiment('when there is no ID', () => {
      beforeEach(async () => {
        result = await event.save(createPojo());
      });

      test('it should call eventService.create', async () => {
        expect(eventsService.create.callCount).to.equal(1);
      });

      test('it should mimic a pool.query() call', async () => {
        expect(result.rowCount).to.equal(1);
        expect(result.rows).to.be.an.array().length(1);
        expect(result.rows[0].event_id).to.equal(eventId);
      });

      test('the result should contain the correct keys', async () => {
        const keys = Object.keys(result.rows[0]);
        expect(keys).to.equal(expectedKeys);
      });
    });

    experiment('when there is an ID', () => {
      beforeEach(async () => {
        const data = {
          ...createPojo(),
          event_id: eventId
        };
        result = await event.save(data);
      });

      test('it should call eventService.update', async () => {
        expect(eventsService.update.callCount).to.equal(1);
      });

      test('it should mimic a pool.query() call', async () => {
        expect(result.rowCount).to.equal(1);
        expect(result.rows).to.be.an.array().length(1);
        expect(result.rows[0].event_id).to.equal(eventId);
      });

      test('the result should contain the correct keys', async () => {
        const keys = Object.keys(result.rows[0]);
        expect(keys).to.equal(expectedKeys);
      });
    });
  });

  experiment('.load', () => {
    experiment('when event exists', () => {
      beforeEach(async () => {
        result = await event.load(eventId);
      });

      test('it should load an event by id', async () => {
        expect(eventsService.findOne.calledWith(
          eventId
        )).to.be.true();
      });

      test('maps found event to POJO', async () => {
        const { created, ...rest } = result;
        expect(isDateString(created)).to.be.true();

        expect(rest).to.equal({
          event_id: eventId,
          licences: ['122434'],
          referenceCode: 'abc',
          type: 'batch',
          subtype: 'test-subtype',
          issuer: 'test@example.com',
          entities: ['foo', 'bar'],
          comment: 'test',
          metadata: {},
          status: 'completed',
          modified: null
        });
      });
    });

    experiment('when event does not exist', () => {
      beforeEach(async () => {
        eventsService.findOne.resolves(null);
        result = await event.load(eventId);
      });

      test('it should load an event by id', async () => {
        expect(eventsService.findOne.calledWith(
          eventId
        )).to.be.true();
      });

      test('result is null', async () => {
        expect(result).to.equal(null);
      });
    });
  });

  experiment('.updateStatus', () => {
    let result;

    beforeEach(async () => {
      result = await event.updateStatus(eventId, 'new-status');
    });

    test('calls eventsService.updateStatus with correct params', async () => {
      const [id, status] = eventsService.updateStatus.lastCall.args;
      expect(id).to.equal(eventId);
      expect(status).to.equal('new-status');
    });

    test('resolves with event POJO with updated status', async () => {
      const { created, ...rest } = result;
      expect(isDateString(created)).to.be.true();

      expect(rest).to.equal({
        event_id: eventId,
        licences: ['122434'],
        referenceCode: 'abc',
        type: 'batch',
        subtype: 'test-subtype',
        issuer: 'test@example.com',
        entities: ['foo', 'bar'],
        comment: 'test',
        metadata: {},
        status: 'new-status',
        modified: null
      });
    });
  });
});

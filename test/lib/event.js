const sinon = require('sinon');
const Joi = require('@hapi/joi');
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const event = require('../../src/lib/event');

const isDateString = str => {
  const { error } = Joi.validate(str, Joi.date().iso());
  return error === null;
};

const isGuid = str => {
  const { error } = Joi.validate(str, Joi.string().guid());
  return error === null;
};

const obj = { foo: 'bar' };
const arr = ['foo', 'bar'];

experiment('event create', () => {
  test('it should create an event with default params', async () => {
    const ev = event.create();

    const { created, ...rest } = ev;

    expect(rest).to.equal({
      eventId: null,
      referenceCode: null,
      type: null,
      subtype: null,
      issuer: null,
      licences: [],
      entities: [],
      comment: null,
      metadata: {},
      status: null,
      modified: null
    });

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

experiment('save', () => {
  const expectedKeys = [
    'event_id',
    'reference_code',
    'type',
    'subtype',
    'issuer',
    'licences',
    'entities',
    'comment',
    'metadata',
    'status',
    'created',
    'modified'
  ];

  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(event.repo, 'update').resolves();
    sandbox.stub(event.repo, 'create').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('it should create a new event', async () => {
    let ev;

    beforeEach(async () => {
      ev = event.create();
    });

    test('it should call repo.create() once', async () => {
      await event.save(ev);

      expect(event.repo.create.callCount).to.equal(1);
    });

    test('it should create a GUID event ID', async () => {
      await event.save(ev);

      const [data] = event.repo.create.firstCall.args;

      // A GUID should have been generated for event ID
      expect(isGuid(data.event_id)).to.equal(true);
    });

    test('it should contain the correct keys', async () => {
      await event.save(ev);

      const [data] = event.repo.create.firstCall.args;

      expect(Object.keys(data)).to.equal(expectedKeys);
    });

    test('modified date should be null', async () => {
      await event.save(ev);

      const [data] = event.repo.create.firstCall.args;

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
      expect(event.repo.update.callCount).to.equal(1);
    });

    test('it should pass the correct filter to repo.update', async () => {
      await event.save(ev);
      const [filter] = event.repo.update.firstCall.args;
      expect(filter).to.equal({
        event_id: ev.eventId
      });
    });

    test('it should pass data with the correct keys to repo.update', async () => {
      await event.save(ev);
      const [, data] = event.repo.update.firstCall.args;
      expect(Object.keys(data)).to.equal(expectedKeys);
    });

    test('it should set a modified date when updating', async () => {
      await event.save(ev);
      const [, { modified }] = event.repo.update.firstCall.args;
      expect(isDateString(modified)).to.equal(true);
    });
  });

  experiment('it should map JSON fields to strings', async () => {
    test('it should stringify objects in jsonb fields', async () => {
      const ev = event.create({
        licences: obj
      });
      await event.save(ev);
      const [data] = event.repo.create.firstCall.args;

      expect(data.licences).to.equal(JSON.stringify(obj));
    });

    test('it should stringify arrays in jsonb fields', async () => {
      const ev = event.create({
        entities: arr
      });
      await event.save(ev);
      const [data] = event.repo.create.firstCall.args;

      expect(data.entities).to.equal(JSON.stringify(arr));
    });

    test('it should leave null unchanged in jsonb fields', async () => {
      const ev = event.create({
        metadata: null
      });
      await event.save(ev);
      const [data] = event.repo.create.firstCall.args;

      expect(data.metadata).to.equal(null);
    });
  });
});

experiment('load', () => {
  const sandbox = sinon.createSandbox();

  beforeEach(async () => {
    sandbox.stub(event.repo, 'find').resolves({
      error: null,
      rows: [{
        licences: arr,
        metadata: obj,
        entities: null
      }]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('it should load an event by id', async () => {
    await event.load('event_id');
    const [filter] = event.repo.find.firstCall.args;
    expect(filter).to.equal({
      event_id: 'event_id'
    });
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
    event.repo.find.resolves({ rowCount: 0 });
    const ev = await event.load('event_id');
    expect(ev).to.equal(null);
  });
});

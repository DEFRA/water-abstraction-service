const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const moment = require('moment');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const repo = require('../../../src/lib/connectors/repos');
const Event = require('../../../src/lib/models/event');
const eventsService = require('../../../src/lib/services/events');

const arr = ['foo', 'bar'];

experiment('lib/event', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  const licence = '122434';

  const testEvent = {
    event_id: 'abc123',
    reference_code: 'abc',
    type: 'batch',
    subtype: 'test-subtype',
    issuer: 'test@user.eu',
    licences: [licence],
    entities: arr,
    comment: 'test',
    metadata: {},
    status: 'completed',
    created: moment().format('YYYY-MM-DD HH:mm:ss'),
    modified: null
  };

  experiment('.create', () => {
    beforeEach(async () => {
      sandbox.stub(repo.events, 'create').resolves(testEvent);
    });

    test('should accept and return an Event data model', async () => {
      const event = new Event();
      event.type = 'test-type';
      const ev = await eventsService.create(event);
      expect(typeof ev).to.equal(typeof event);
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const event = new Event();
      event.type = 'test-type';
      const { created } = await eventsService.create(event);
      expect(moment.isMoment(created)).to.equal(true);
    });

    test('should send the correct data to the database repos layer', async () => {
      const event = new Event();
      event.type = 'test-type';
      event.referenceCode = 'testRef123';
      event.subtype = 'test-subtype';
      event.issuer = 'test@user.eu';
      event.licences = [licence];
      event.entities = arr;
      event.comment = 'test';
      event.metadata = {};
      event.status = 'completed';
      await eventsService.create(event);
      const { args } = repo.events.create.firstCall;
      expect(args[0].type).to.equal(event.type);
      expect(args[0].referenceCode).to.equal(event.referenceCode);
      expect(args[0].issuer).to.equal(event.issuer);
      expect(args[0].licences).to.equal(event.licences);
      expect(args[0].entities).to.equal(event.entities);
      expect(args[0].comment).to.equal(event.comment);
      expect(args[0].metadata).to.be.an.object().and.to.be.empty();
      expect(args[0].status).to.equal(event.status);
    });
  });

  experiment('.update', () => {
    beforeEach(async () => {
      sandbox.stub(repo.events, 'update').resolves(testEvent);
    });

    test('should accept and return an Event data model', async () => {
      const event = new Event();
      event.type = 'test-type';
      const ev = await eventsService.update(event);
      expect(typeof ev).to.equal(typeof event);
    });

    test('should map the model keys to snake_case before sending it to database repos layer', async () => {
      const event = new Event();
      event.type = 'test-type';
      event.referenceCode = 'testRef123';
      await eventsService.update(event);
      const { args } = repo.events.update.firstCall;
      expect(Object.keys(args[1])).to.include('referenceCode');
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const event = new Event();
      event.type = 'test-type';
      const { created } = await eventsService.update(event);
      expect(moment.isMoment(created)).to.equal(true);
    });

    test('should send the correct data to the database repos layer', async () => {
      const event = new Event();
      event.type = 'test-type';
      event.referenceCode = 'testRef123';
      event.subtype = 'test-subtype';
      event.issuer = 'test@user.eu';
      event.licences = [licence];
      event.entities = arr;
      event.comment = 'test';
      event.metadata = {};
      event.status = 'completed';
      await eventsService.update(event);
      const { args } = repo.events.update.firstCall;
      expect(args[1].type).to.equal(event.type);
      expect(args[1].referenceCode).to.equal(event.referenceCode);
      expect(args[1].issuer).to.equal(event.issuer);
      expect(args[1].licences).to.equal(event.licences);
      expect(args[1].entities).to.equal(event.entities);
      expect(args[1].comment).to.equal(event.comment);
      expect(args[1].metadata).to.be.an.object().and.to.be.empty();
      expect(args[1].status).to.equal(event.status);
    });
  });

  experiment('.updateStatus', () => {
    beforeEach(async () => {
      sandbox.stub(repo.events, 'update').resolves(testEvent);
    });

    test('should return an Event data model', async () => {
      const event = new Event();
      const ev = await eventsService.updateStatus('testEventId', 'testStatus');
      expect(typeof ev).to.equal(typeof event);
    });

    test('should include the eventId when calling the update() method at the database repos layer', async () => {
      await eventsService.updateStatus('testEventId', 'testStatus');
      const { args } = repo.events.update.firstCall;
      expect(args[0]).to.equal('testEventId');
      expect(args[1]).to.equal({ status: 'testStatus' });
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const event = new Event();
      event.type = 'test-type';
      const { created } = await eventsService.updateStatus(event);
      expect(moment.isMoment(created)).to.equal(true);
    });
  });

  experiment('.findOne', () => {
    beforeEach(async () => {
      sandbox.stub(repo.events, 'findOne').resolves(testEvent);
    });

    test('should return an Event data model', async () => {
      const event = new Event();
      const ev = await eventsService.findOne('testEventId', 'testStatus');
      expect(typeof ev).to.equal(typeof event);
    });

    test('should include the eventId when calling the findOne method at the database repos layer', async () => {
      await eventsService.findOne('testEventId');
      const { args } = repo.events.findOne.firstCall;
      expect(args[0]).to.equal('testEventId');
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const event = new Event();
      event.type = 'test-type';
      const { created } = await eventsService.findOne(event);
      expect(moment.isMoment(created)).to.equal(true);
    });
  });
});

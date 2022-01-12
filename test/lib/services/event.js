'use strict';

const uuid = require('uuid/v4');
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
const Pagination = require('../../../src/lib/models/pagination');
const NotificationEvent = require('../../../src/lib/models/notification-event');

const eventsService = require('../../../src/lib/services/events');

const arr = ['foo', 'bar'];

experiment('lib/services/event', () => {
  beforeEach(async () => {
    sandbox.stub(repo.events, 'findNotifications');
    sandbox.stub(repo.events, 'findNotificationsCount');
  });

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
    experiment('when the event is found', () => {
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

    experiment('when the event is not found', () => {
      beforeEach(async () => {
        sandbox.stub(repo.events, 'findOne').resolves(null);
      });

      test('resolves null', async () => {
        const result = await eventsService.findOne('testEventId', 'testStatus');
        expect(result).to.be.null();
      });
    });
  });

  experiment('.getKPIReturnsMonthly', () => {
    const testKPIData = { rowCount: 1, rows: [{ current_year: true }] };
    beforeEach(async () => {
      sandbox.stub(repo.events, 'getKPIReturnsMonthlyData').resolves(testKPIData);
    });

    afterEach(async => {
      sandbox.restore();
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const data = await eventsService.getKPIReturnsMonthly();
      expect(data[0].currentYear).to.equal(true);
    });
  });

  experiment('.getKPILicenceNames', () => {
    const testKPIData = { rowCount: 1, rows: [{ current_year: true }] };
    beforeEach(async () => {
      sandbox.stub(repo.events, 'getKPILicenceNamesData').resolves(testKPIData);
    });

    afterEach(async => {
      sandbox.restore();
    });

    test('should map the object key receveived from the database repos layer to camelCase', async () => {
      const data = await eventsService.getKPILicenceNames();
      expect(data[0].currentYear).to.equal(true);
    });
  });

  experiment('.getNotificationEvents', () => {
    let result;
    const page = 3;

    beforeEach(async () => {
      repo.events.findNotifications.resolves({
        rows: [{
          ...testEvent,
          event_id: uuid(),
          statuses: [{
            status: 'technical-failure',
            count: 2
          }]
        }]
      });
      repo.events.findNotificationsCount.resolves({
        rows: [{
          count: 123
        }]
      });
      result = await eventsService.getNotificationEvents(page);
    });

    test('calls repo .findNotifications method with expected limit/offset params', async () => {
      expect(repo.events.findNotifications.calledWith({
        limit: 50,
        offset: 100,
        categories: '',
        sender: ''
      })).to.be.true();
    });

    test('calls repo .findNotificationsCount method', async () => {
      expect(repo.events.findNotifications.called).to.be.true();
    });

    test('result includes a pagination model', async () => {
      const { pagination } = result;
      expect(pagination instanceof Pagination).to.be.true();
      expect(pagination.page).to.equal(page);
      expect(pagination.totalRows).to.equal(123);
      expect(pagination.pageCount).to.equal(3);
      expect(pagination.perPage).to.equal(50);
    });

    test('result includes an array of NotificationEvent models', async () => {
      const { data } = result;
      expect(data).to.be.an.array().length(1);
      expect(data[0] instanceof NotificationEvent).to.be.true();
    });
  });
});

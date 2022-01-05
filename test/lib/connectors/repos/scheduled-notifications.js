'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const repoHelpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const raw = require('../../../../src/lib/connectors/repos/lib/raw');
const repo = require('../../../../src/lib/connectors/repos/scheduled-notifications');
const ScheduledNotification = require('../../../../src/lib/connectors/bookshelf/ScheduledNotification');
const envelope = require('../../../../src/lib/connectors/repos/lib/envelope');

experiment('lib/connectors/repos/scheduled-notifications', () => {
  let stub;

  beforeEach(async () => {
    stub = {
      where: sandbox.stub().returnsThis(),
      orderBy: sandbox.stub().returnsThis(),
      fetchPage: sandbox.stub()
    };

    sandbox.stub(repoHelpers, 'create');
    sandbox.stub(repoHelpers, 'findOne');
    sandbox.stub(repoHelpers, 'findMany');
    sandbox.stub(raw, 'multiRow').resolves([]);
    sandbox.stub(ScheduledNotification, 'forge').returns(stub);
    sandbox.stub(envelope, 'paginatedEnvelope');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.create', () => {
    test('calls through to the helpers create function', async () => {
      await repo.create({ one: 1 });

      const [model, data] = repoHelpers.create.lastCall.args;
      expect(model).to.equal(ScheduledNotification);
      expect(data).to.equal({ one: 1 });
    });
  });

  experiment('.findOne', () => {
    test('calls through to the helpers findOne function', async () => {
      await repo.findOne('test-id');

      const [model, idKey, id] = repoHelpers.findOne.lastCall.args;
      expect(model).to.equal(ScheduledNotification);
      expect(idKey).to.equal('id');
      expect(id).to.equal('test-id');
    });
  });

  experiment('.findByEventId', () => {
    const eventId = 'test-event-id';

    beforeEach(async () => {
      await repo.findByEventId(eventId);
    });

    test('calls through to the helpers findMany function', async () => {
      expect(repoHelpers.findMany.calledWith(
        ScheduledNotification, { event_id: eventId }
      )).to.be.true();
    });
  });

  experiment('.findByLicenceNumber', () => {
    const licenceNumber = '01/123/ABC';
    const page = 1;
    const perPage = 50;

    beforeEach(async () => {
      await repo.findByLicenceNumber(licenceNumber, page, perPage);
    });

    test('.forge() on the model', async () => {
      expect(ScheduledNotification.forge.called).to.be.true();
    });

    test('queries for the correct data', async () => {
      expect(stub.where.calledWith(
        'licences', '@>', `"${licenceNumber}"`
      )).to.be.true();
      expect(stub.where.calledWith(
        'notify_status', 'in', ['delivered', 'received']
      )).to.be.true();
      expect(stub.where.calledWith(
        'status', 'sent'
      )).to.be.true();
      expect(stub.where.calledWith(
        'event_id', 'is not', null
      )).to.be.true();
    });

    test('sorts by the send_after field descending', async () => {
      expect(stub.orderBy.calledWith(
        'send_after', 'desc'
      )).to.be.true();
    });

    test('fetches a page of results', async () => {
      expect(stub.fetchPage.calledWith({
        page,
        pageSize: perPage,
        withRelated: [
          'event'
        ]
      })).to.be.true();
    });

    test('maps the result to envelope.paginatedEnvelope', async () => {
      expect(envelope.paginatedEnvelope.called).to.be.true();
    });
  });
  experiment('.getScheduledNotificationCategories', () => {
    beforeEach(() => repo.getScheduledNotificationCategories());
    test('calls the pool/query builder', () => {
      expect(raw.multiRow.called).to.be.true();
    });
  });
});

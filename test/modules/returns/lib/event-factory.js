const { expect } = require('code');
const { omit } = require('lodash');
const { experiment, test } = exports.lab = require('lab').script();
const { eventFactory } = require('../../../../src/modules/returns/lib/event-factory');

const ret = {
  returnId: '36f0296a-9812-408a-9346-60ea90945864',
  licenceNumber: '01/234/567',
  status: 'due',
  receivedDate: '2018-04-25',
  underQuery: false,
  user: {
    email: 'mail@example.com',
    type: 'internal',
    entityId: 'ca3dc532-23de-4301-adbe-007409f340e0'
  }
};

const version = {
  version_id: 'd00b67dd-54bd-4f00-b3c0-f3e83aa16315'
};

const isoDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+[0-9]{2}:[0-9]{2}$/;

experiment('eventFactory', () => {
  test('creates event object for submit event', async () => {
    const event = eventFactory(ret, version);
    const data = omit(event, ['created', 'event_id']);

    expect(data).to.equal({
      reference_code: null,
      type: 'return',
      subtype: 'internal',
      issuer: 'mail@example.com',
      licences: '["01/234/567"]',
      entities: '["ca3dc532-23de-4301-adbe-007409f340e0"]',
      comment: undefined,
      metadata: '{"returnId":"36f0296a-9812-408a-9346-60ea90945864","versionId":"d00b67dd-54bd-4f00-b3c0-f3e83aa16315","return":{"returnId":"36f0296a-9812-408a-9346-60ea90945864","licenceNumber":"01/234/567","status":"due","receivedDate":"2018-04-25","underQuery":false,"user":{"email":"mail@example.com","type":"internal","entityId":"ca3dc532-23de-4301-adbe-007409f340e0"}},"receivedDate":"2018-04-25","underQuery":false}',
      status: 'due' });

    // Event ID should be GUID
    expect(event.event_id).to.be.a.string();
    expect(event.event_id).to.have.length(36);

    // Check timestamp
    expect(event.created).to.match(isoDateRegex);
  });

  test('creates event object for update status event', async () => {
    const event = eventFactory(ret, null, 'return.status');
    const data = omit(event, ['created', 'event_id']);

    expect(data).to.equal({
      reference_code: null,
      type: 'return.status',
      subtype: 'internal',
      issuer: 'mail@example.com',
      licences: '["01/234/567"]',
      entities: '["ca3dc532-23de-4301-adbe-007409f340e0"]',
      comment: undefined,
      metadata: '{"returnId":"36f0296a-9812-408a-9346-60ea90945864","versionId":null,"return":{"returnId":"36f0296a-9812-408a-9346-60ea90945864","licenceNumber":"01/234/567","status":"due","receivedDate":"2018-04-25","underQuery":false,"user":{"email":"mail@example.com","type":"internal","entityId":"ca3dc532-23de-4301-adbe-007409f340e0"}},"receivedDate":"2018-04-25","underQuery":false}',
      status: 'due' });

    // Event ID should be GUID
    expect(event.event_id).to.be.a.string();
    expect(event.event_id).to.have.length(36);

    // Check timestamp
    expect(event.created).to.match(isoDateRegex);
  });

  test('rejects an invalid event type', async () => {
    const func = () => {
      eventFactory(ret, null, 'return.INVALID');
    };

    expect(func).to.throw();
  });
});

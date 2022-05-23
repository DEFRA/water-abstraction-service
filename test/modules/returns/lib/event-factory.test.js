const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const eventFactory = require('../../../../src/modules/returns/lib/event-factory');

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

experiment('eventFactory', () => {
  experiment('.createSubmissionEvent', () => {
    test('creates event object for submit event', async () => {
      const event = eventFactory.createSubmissionEvent(ret, version);

      expect(event.type).to.equal('return');
      expect(event.subtype).to.equal('internal');
      expect(event.issuer).to.equal('mail@example.com');
      expect(event.licences).to.equal(['01/234/567']);
      expect(event.entities).to.equal(['ca3dc532-23de-4301-adbe-007409f340e0']);
      expect(event.metadata).to.equal({
        returnId: '36f0296a-9812-408a-9346-60ea90945864',
        versionId: 'd00b67dd-54bd-4f00-b3c0-f3e83aa16315',
        return: {
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
        },
        receivedDate: '2018-04-25',
        underQuery: false
      });
      expect(event.status).to.equal('due');
    });

    test('creates event object for update status event', async () => {
      const event = eventFactory.createSubmissionEvent(ret, null, 'return.status');

      expect(event.type).to.equal('return.status');
      expect(event.subtype).to.equal('internal');
      expect(event.issuer).to.equal('mail@example.com');
      expect(event.licences).to.equal(['01/234/567']);
      expect(event.entities).to.equal(['ca3dc532-23de-4301-adbe-007409f340e0']);
      expect(event.metadata).to.equal({
        returnId: '36f0296a-9812-408a-9346-60ea90945864',
        versionId: null,
        return: {
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
        },
        receivedDate: '2018-04-25',
        underQuery: false
      });
      expect(event.status).to.equal('due');
    });

    test('rejects an invalid event type', async () => {
      const func = () => {
        eventFactory(ret, null, 'return.INVALID');
      };
      expect(func).to.throw();
    });
  });
});

'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const eventService = require('../../../../src/lib/services/events');
const Event = require('../../../../src/lib/models/event');

const helpers = require('../../../../src/modules/contacts/lib/helpers');
const Contact = require('../../../../src/lib/models/contact-v2');

const contact = new Contact();
contact.fromHash({
  type: 'person',
  salutation: 'Mr',
  firstName: 'Johnny',
  lastName: 'Test'
});

experiment('modules/contacts/lib/helpers', () => {
  beforeEach(() => {
    sandbox.stub(eventService, 'create');
  });

  afterEach(() => sandbox.restore());

  experiment('.createAddressEvent', () => {
    beforeEach(async () => {
      await helpers.createContactEvent({
        issuer: 'test@example.com',
        contact
      });
    });

    experiment('the contact event', () => {
      let event;
      beforeEach(() => {
        event = eventService.create.lastCall.args[0];
      });

      test('is an instance of the Event model', () => {
        expect(event).to.be.instanceOf(Event);
      });

      test('has the correct type', () => {
        expect(event.type).to.equal('contact:create');
      });

      test('has the correct issuer', () => {
        expect(event.issuer).to.equal('test@example.com');
      });

      test('has the contact in the metadata', () => {
        expect(event.metadata.contact).to.equal(contact);
      });

      test('has the correct status', () => {
        expect(event.status).to.equal('created');
      });
    });
  });
});

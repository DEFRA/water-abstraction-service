'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const eventService = require('../../../../src/lib/services/events');
const Event = require('../../../../src/lib/models/event');

const helpers = require('../../../../src/modules/addresses/lib/helpers');
const Address = require('../../../../src/lib/models/address');

const address = new Address();
address.fromHash({
  addressLine2: 'test-address-2',
  addressLine3: 'test-address-3',
  town: 'Testington',
  postcode: 'TT1 1TT'
});

experiment('modules/addresses/services/address-service', () => {
  beforeEach(() => {
    sandbox.stub(eventService, 'create');
  });

  afterEach(() => sandbox.restore());

  experiment('.createAddressEvent', () => {
    beforeEach(async () => {
      await helpers.createAddressEvent({
        issuer: 'test@example.com',
        address
      });
    });

    experiment('the address event', () => {
      let event;
      beforeEach(() => {
        event = eventService.create.lastCall.args[0];
      });

      test('is an instance of the Event model', () => {
        expect(event).to.be.instanceOf(Event);
      });

      test('has the correct type', () => {
        expect(event.type).to.equal('address:create');
      });

      test('has the correct issuer', () => {
        expect(event.issuer).to.equal('test@example.com');
      });

      test('has the address in the metadata', () => {
        expect(event.metadata.address).to.equal(address);
      });

      test('has the correct status', () => {
        expect(event.status).to.equal('created');
      });
    });
  });
});
